async function login(email, password, callback) {
	let user;

	const validateResponse = await fetch(`https://${configuration.TENANT_DOMAIN}/oauth/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			grant_type: 'password',
			username: email,
			password: password,
			client_id: `${configuration.PROXY_ID}`,
			client_secret: `${configuration.PROXY_SECRET}`,
			scope: 'openid',
			audience: `https://${configuration.TENANT_DOMAIN}/api/v2/`
		})
	})

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


	if (validateResponse.ok && clientTokenResponse.ok) {
		const validateData = await validateResponse.json();
		const validateToken = validateData.access_token;

		console.log('Success Requesting Validate Access Token');


		let validateUserOptions = {
			method: 'GET',
			headers: { authorization: `Bearer ${validateToken}`, 'Content-Type': 'application/json' }
		}
		const validateUserResponse = await fetch(`https://${configuration.TENANT_DOMAIN}/userinfo`, validateUserOptions);

		if (!validateUserResponse.ok) {
			throw new Error('Failed Requesting Validated User Data')
		}

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

		if (user != [] && user != null) {
			console.log(user);
			let userId = user.user_id.toString().split("auth0|");

			if (userId.length >= 2) {
				if (userId[userId.length - 1] != '') {
					userId = userId[userId.length - 1];
				}
			} else {
				userId = user.user_id.toString()
			}

			return callback(null, {
				user_id: userId,
				username: user.username,
				email: user.email,
				connection: "auth0-default-connection"
			});
		}
	} else {
		return callback(new Error('Failed requesting User Data'));
	}
}


