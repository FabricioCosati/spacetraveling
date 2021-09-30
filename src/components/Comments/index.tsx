import React, { Component } from "react";

export default class Comments extends Component {

    componentDidMount() {
        let script = document.createElement("script");
        let anchor = document.getElementById("inject-comments-for-uterances");
        script.setAttribute("src", "https://utteranc.es/client.js");
        script.setAttribute("crossorigin", "anonymous");
        script.setAttribute("async", "true");
        script.setAttribute("repo", "FabricioCosati/comments-spacetraveling");
        script.setAttribute("issue-term", "url");
        script.setAttribute("theme", "github-dark");
        anchor.appendChild(script);
        console.log(this.props)
    }

    render() {
        return (
            <div className={`${this.props.children}`} id="inject-comments-for-uterances"></div>
        );
    }
}