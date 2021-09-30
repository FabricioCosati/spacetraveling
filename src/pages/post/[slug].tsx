import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';
import { FiCalendar, FiUser, FiClock } from "react-icons/fi"
import { format, parseISO } from 'date-fns';
import { RichText } from 'prismic-dom';

import Prismic from "@prismicio/client"
import Link from "next/link"
import Head from 'next/head';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import Comments from '../../components/Comments';


interface Post {
    uid: string,
    first_publication_date: string | null;
    last_publication_date: string | null;
    data: {
        title: string;
        banner: {
            url: string;
        };
        author: string;
        content: {
            heading: string;
            body: {
                text: string;
            }[];
        }[];
    };
}

interface PostProps {
    post: Post;
    prevPost: Post;
    nextPost: Post;
    preview: boolean;
}

export default function Post({ post, prevPost, nextPost, preview }: PostProps) {
    const router = useRouter()
    const textArray = []

    if (router.isFallback) {
        return <h1>Carregando...</h1>
    }

    post.data.content.reduce(function (acc, currentValue) {
        let array = []
        const allText = RichText.asText(acc.body) + RichText.asText(currentValue.body)
        array = allText.split(/\S+\s*/g)
        textArray.push(array.length)

        return acc
    })

    const numberWords = textArray.reduce((acc, currentValue) => acc + currentValue)
    const readTime = Math.ceil(numberWords / 200)

    return (
        <>
            <Head >
                <title> {post.data.title} | Spacetraveling</title>
            </Head>
            <Header />

            <img className={styles.banner} src={post.data.banner.url} alt="" />

            <main className={`${commonStyles.mainComponent} ${styles.mainComponent}`}>
                <article className={styles.content}>
                    <h1>{post.data.title}</h1>

                    <div className={styles.info}>
                        <time> <FiCalendar /> {post.first_publication_date}</time>
                        <p> <FiUser /> {post.data.author}</p>
                        <p><FiClock /> {readTime} {readTime === 1 ? "minuto" : "minutos"}</p>
                    </div>

                    <div className={styles.edit}>
                        <p>*editado em {post.last_publication_date}</p>
                    </div>

                    <div>
                        {post.data.content.map(postContent => (
                            <div key={postContent.heading}>
                                <h2>{postContent.heading}</h2>
                                <div
                                    className={styles.postContent}
                                    dangerouslySetInnerHTML={{ __html: RichText.asHtml(postContent.body) }}
                                ></div>
                            </div>
                        ))}
                    </div>
                </article>

                <div className={styles.divider} />

                <div className={styles.previousAndNextPage}>

                    {prevPost ?
                        <div>
                            <h3>{prevPost.data.title}</h3>
                            <Link href={`/post/${prevPost.uid}`}>
                                <a>Post Anterior</a>
                            </Link>
                        </div> : <div></div>
                    }

                    {nextPost ?
                        <div>
                            <h3>{nextPost.data.title}</h3>
                            <Link href={`/post/${nextPost.uid}`}>
                                <a>Próximo post</a>
                            </Link>
                        </div> : <div></div>
                    }

                </div>

                <Comments children={styles.commentsComponent} />

                {preview && (
                    <aside className={commonStyles.previewButton}>
                        <Link href="/api/exit-preview">
                            <a>Sair do modo Preview</a>
                        </Link>
                    </aside>
                )}

            </main>
        </>
    )
}

export const getStaticPaths: GetStaticPaths = async () => {

    const prismic = getPrismicClient()
    const res = await prismic.query("", {})

    const posts = res.results.map(post => {
        return {
            uid: post.uid,
        }
    })

    const paths = posts.map(post => (
        {
            params: { slug: post.uid }
        }
    ))

    return {
        paths,
        fallback: true
    }
}

export async function getStaticProps({ params, preview = false, previewData }) {
    const { slug } = params

    const prismic = getPrismicClient()
    let res = await prismic.getByUID("post", String(slug), {
        ref: previewData?.ref ?? null,
    })

    const post = {
        id: res.id,
        first_publication_date: format(
            new Date(res.first_publication_date),
            `dd ${String("LLLL").substring(0, 3)} yyyy`,
            {
                locale: ptBR,
            }
        ),
        last_publication_date: format(
            new Date(res.last_publication_date),
            `dd ${String("LLLL").substring(0, 3)} yyyy, .. hh:mm a`,
            {
                locale: ptBR,
            }
        ).replace("..", "às"),
        data: {
            uid: res.uid,
            title: res.data.title,
            subtitle: res.data.subtitle,
            banner: {
                url: res.data.banner.url
            },
            author: res.data.author,
            content: res.data.content.map(postContent => {
                return {
                    heading: postContent.heading,
                    body: [...postContent.body]
                }
            })
        }
    }

    const prevResponse = await prismic.query([Prismic.Predicates.at("document.type", "post")],
        {
            pageSize: 1,
            after: `${post.id}`,
            orderings: '[document.first_publication_date]'
        })

    const nextResponse = await prismic.query([Prismic.Predicates.at("document.type", "post")],
        {
            pageSize: 1,
            after: `${post.id}`,
            orderings: '[document.first_publication_date desc]'
        })

    const prevPost = prevResponse.results[0] || null
    const nextPost = nextResponse.results[0] || null

    return {
        props: {
            post,
            prevPost,
            nextPost,
            preview
        }
    }
}