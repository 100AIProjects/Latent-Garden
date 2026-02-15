import { defineConfig } from 'astro/config';
import wikiLinkPlugin from 'remark-wiki-link';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Wikilink → slug mapping for garden content
const WIKI_MAP = {
    'constitution': '002-my-constitution',
    'my-constitution': '002-my-constitution',
    'llms-therapist': '005-llms-therapist',
    'morning-pages': '004-morning-pages',
    'token-usage': '003-token-usage',
    'about-the-garden': '001-about-the-garden',
};

export default defineConfig({
    markdown: {
        remarkPlugins: [
            remarkMath,
            [wikiLinkPlugin, {
                pageResolver: (name) => {
                    const key = name.toLowerCase().replace(/\s+/g, '-');
                    if (WIKI_MAP[key]) return [WIKI_MAP[key]];
                    // Partial match fallback
                    for (const [k, slug] of Object.entries(WIKI_MAP)) {
                        if (k.includes(key) || key.includes(k)) return [slug];
                    }
                    return [key];
                },
                hrefTemplate: (permalink) => `/${permalink}`,
            }],
        ],
        rehypePlugins: [rehypeKatex],
    },
});
