async function remove(id, callback) {

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

	let userSearchOptions = {
		method: 'DELETE',
		headers: { authorization: `Bearer ${clientToken}` }
	}
	const userSearchResponse = await fetch(`https://${configuration.TENANT_DOMAIN}/api/v2/users/${id}`, userSearchOptions);

	const msg = 'Please implement the Delete script for this database ' +
		'connection at https://manage.auth0.com/#/connections/database';
	return callback(new Error(msg));
}
