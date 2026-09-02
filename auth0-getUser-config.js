async function getByEmail(email, callback) {
	let user;

	const clientTokenResponse = await fetch(`https://${configuration.TENANT_DOMAIN}/oauth/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			grant_type: 'client_credentials',
			client_id: `${configuration.PROXY_ID}`,
			client_secret: `${configuration.PROXY_SECRET}`,
			audience: `https://${configuration.TENANT_DOMAIN}/api/v2/`
		}),
	})

	const clientTokenData = await clientTokenResponse.json();
	const clientToken = clientTokenData.access_token;

	if (clientTokenResponse.ok) {
		let userSearchOptions = {
			method: 'GET',
			headers: { authorization: `Bearer ${clientToken}` }
		}
		const userSearchResponse = await fetch(`https://${configuration.TENANT_DOMAIN}/api/v2/users?q=email:\"${email}\"&search_engine=v2`, userSearchOptions);

		if (!userSearchResponse.ok) {
			throw new Error('Failed requesting User Data')
		}

		const userData = await userSearchResponse.json();
		user = userData[0];
    
    console.log(user)
    
    if(user) {
    	return callback(null, {
				user_id: user.id,
				username: user.username,
				email: user.email,
				connection: "auth0-default-connection"
    	});
    } else {
          return callback(null, null);
    }
	}
}