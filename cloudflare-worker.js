addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})



async function handleRequest(request) {
    const {pathname, origin} = new URL(request.url)

    const shortCode = pathname
        .replace('/r', '')
        .replace('/', '')

    if (shortCode === ADMIN_TOKEN)
        return await handleAdminRequest(request, origin)
    else
        return await redirect(shortCode, pathname.startsWith('/r'))
}



async function redirect(shortCode, urlRewrite) {
    const url = await db.get(shortCode)

    if (url) {

        if (urlRewrite)
            return Response.redirect(url)
        else
            return await fetch(url)
            
    } else {

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
}



async function handleAdminRequest(request, urlOrigin) {
    
        var data

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

        if (!data.shortCode || !data.target)
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

        if (await db.get(data.shortCode))
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

        return await addRedirection(data, urlOrigin)
}



async function addRedirection(data, urlOrigin) {

    db.put(data.shortCode, data.target)

    return new Response(
        JSON.stringify({
            success: true,
            data: {
                shortUrl: urlOrigin + '/' + data.shortCode,
                target: data.target
            }
        }), {
            status: 200,
            headers: new Headers({
                'content-type': 'application/json'
            })
        }
    )
}
