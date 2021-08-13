addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    const requestUrl = new URL(request.url)
    const path = requestUrl.pathname.replace('/s/', '')
    if (path === ADMIN_TOKEN) {
        let data
        try {
            data = await request.json()
        } catch (e) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'invalid body'
                }), {
                    status: 400,
                    headers: new Headers({
                        'content-type': 'application/json'
                    })
                }
            )
        }
        return await addRedirection(data)
    } else
        return await redirect(path)
}

async function redirect(shortName) {
    const url = await db.get(shortName)
    if (url)
        return Response.redirect(url)
    else
        return new Response(
            JSON.stringify({
                success: false,
                error: 'shortCode not found'
            }), {
                status: 404,
                headers: new Headers({
                    'content-type': 'application/json'
                })
            }
        )
}

async function addRedirection(data) {
    if (data.shortCode && data.target) {
        const existingUrl = await db.get(data.shortCode)
        if (!existingUrl) {
            db.put(data.shortCode, data.target)
            return new Response(
                JSON.stringify({
                    success: true,
                    data: {
                        shortUrl: requestUrl.origin + '/s/' + data.shortCode,
                        target: data.target
                    }
                }), {
                    status: 200,
                    headers: new Headers({
                        'content-type': 'application/json'
                    })
                }
            )
        } else
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'shortCode already used'
                }), {
                    status: 409,
                    headers: new Headers({
                        'content-type': 'application/json'
                    })
                }
            )
    } else
        return new Response(
            JSON.stringify({
                success: false,
                error: 'missing parameters'
            }), {
                status: 422,
                headers: new Headers({
                    'content-type': 'application/json'
                })
            }
        )
}
