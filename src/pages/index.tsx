import { useCallback, useState } from 'react';
import { GetStaticProps } from 'next';
import { getPrismicClient } from '../services/prismic';
import { format } from "date-fns"
import { FiCalendar, FiUser } from "react-icons/fi"

import Prismic from "@prismicio/client"
import Head from 'next/head';
import Link from "next/link"
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
	uid?: string;
	first_publication_date: string | null;
	data: {
		title: string;
		subtitle: string;
		author: string;
	};
}

interface PostPagination {
	next_page: string;
	results: Post[];
}

interface HomeProps {
	postsPagination: PostPagination;
	preview: boolean
}

export default function Home({ postsPagination, preview }: HomeProps) {

	const { results, next_page } = postsPagination
	const [posts, setPosts] = useState(results)
	const [page, setPage] = useState(next_page)

	const loadMore = useCallback(async () => {
		const postsArray = [...posts]

		const req = await fetch(page)
		const data = await req.json()

		data.results.map(post => {
			const formatedPost = {
				uid: post.uid,
				first_publication_date: format(
					new Date(post.first_publication_date),
					`dd ${String("LLLL").substring(0, 3)} yyyy`,
					{
						locale: ptBR,
					}
				),
				data: {
					title: post.data.title,
					subtitle: post.data.subtitle,
					author: post.data.author
				}
			}

			return postsArray.push(formatedPost)
		})

		setPosts(postsArray)
		setPage(data.next_page)
		return

	}, [page])

	return (
		<>
			<Head >
				<title>Home | Spacetraveling</title>
			</Head>

			<Header></Header>

			<main className={`${commonStyles.mainComponent} ${styles.mainComponent}`}>
				{posts.map(post => (
					<div key={post.uid} className={styles.content}>
						<Link href={`/post/${post.uid}`}>
							<a>
								<h1>{post.data.title}</h1>
								<p>{post.data.subtitle}</p>
							</a>
						</Link>
						<div>
							<time> <FiCalendar /> {post.first_publication_date}</time>
							<p> <FiUser /> {post.data.author}</p>
						</div>
					</div>
				))}
				{page ? <button onClick={loadMore}>Carregar mais posts</button> : ""}

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

/* export const getStaticProps: GetStaticProps<HomeProps> = async ({ preview = false, previewData }) => { */
export async function getStaticProps({ preview = false, previewData }) {

	const prismic = getPrismicClient()
	const resp = await prismic.query([Prismic.Predicates.at("document.type", "post")],
		{
			pageSize: 2,
			ref: previewData?.ref ?? null,
			orderings: '[document.first_publication_date desc]'

		})

	const posts = resp.results.map(post => {
		return {
			uid: post.uid,
			first_publication_date: format(
				new Date(resp.results[0].first_publication_date),
				`dd ${String("LLLL").substring(0, 3)} yyyy`,
				{
					locale: ptBR,
				}
			),
			data: {
				title: post.data.title,
				subtitle: post.data.subtitle,
				author: post.data.author
			}
		}
	})

	const postsPagination = {
		next_page: resp.next_page,
		results: posts
	}

	return {
		props: { postsPagination, preview }
	}
}