export default defineCachedEventHandler(event => listPosts(event), { maxAge: 60, swr: false })
