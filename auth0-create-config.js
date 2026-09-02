async function create(user, callback) {
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


	function generateUUID() { // Public Domain/MIT
		var d = new Date().getTime();//Timestamp
		var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = Math.random() * 16;//random number between 0 and 16
			if (d > 0) {//Use timestamp until depleted
				r = (d + r) % 16 | 0;
				d = Math.floor(d / 16);
			} else {//Use microseconds since page-load if supported
				r = (d2 + r) % 16 | 0;
				d2 = Math.floor(d2 / 16);
			}
			return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
		});
	}


	const createdUser = {
		email: `${user.email}`,
		user_metadata: {},
		blocked: false,
		email_verified: false,
		app_metadata: {},
		name: `${user.email}`,
		user_id: `${generateUUID()}`,
		connection: "auth0-default-connection",
		password: `${user.password}`,
		verify_email: false,

	}


	await fetch(`https://${configuration.TENANT_DOMAIN}/api/v2/users`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', authorization: `Bearer ${clientToken}` },
		body: JSON.stringify(createdUser)
	});

	let userSearchOptions = {
		method: 'GET',
		headers: { authorization: `Bearer ${clientToken}` }
	}
	const userSearchResponse = await fetch(`https://${configuration.TENANT_DOMAIN}/api/v2/users?q=email:\"${user.email}\"&search_engine=v2`, userSearchOptions);

	if (!userSearchResponse.ok) {
		throw new Error('Failed requesting User Data')
	}


	const userData = await userSearchResponse.json();

	let userId
	if (createdUser != [] && createdUser != null) {
		userId = userData[0].user_id.toString().split("auth0|");

		if (userId.length >= 2) {
			if (userId[userId.length - 1] != '') {
				userId = userId[userId.length - 1];
			}
		} else {
			userId = createdUser.user_id.toString()
		}
	}

	return callback(null, {
		user_id: userId,
		username: user.username,
		email: user.email,
		connection: "auth0-default-connection"
	})
}