async function login(email, password, callback) {
	const mysql = require('mysql');
	const bcrypt = require('bcrypt');

	let user;


	
	const validateResponse = await fetch(`https://dev-h7163bsxqf345cvn.us.auth0.com/oauth/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			grant_type: 'password',
			username: email,
			password: password,
			client_id: `${configuration.PROXY_ID}`,
			client_secret: `${configuration.PROXY_SECRET}`,
			scope: 'openid',
			audience: `https://dev-h7163bsxqf345cvn.us.auth0.com/api/v2/`
		})
	})
	


	const clientTokenResponse = await fetch(`https://dev-h7163bsxqf345cvn.us.auth0.com/oauth/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			grant_type: 'client_credentials',
			client_id: `${configuration.PROXY_ID}`,
			client_secret: `${configuration.PROXY_SECRET}`,
			audience: `https://dev-h7163bsxqf345cvn.us.auth0.com/api/v2/`
		}),
	})


	const clientTokenData = await clientTokenResponse.json();
	const clientToken = clientTokenData.access_token;


	
	console.log(`auth0 user: ${validateResponse.ok}`);

	if (validateResponse.ok && clientTokenResponse.ok) {
		const validateData = await validateResponse.json();
		const validateToken = validateData.access_token;

		console.log('Success Requesting Validate Access Token');


		let validateUserOptions = {
			method: 'GET',
			headers: { authorization: `Bearer ${validateToken}`, 'Content-Type': 'application/json' }
		}
		const validateUserResponse = await fetch(`https://dev-h7163bsxqf345cvn.us.auth0.com/userinfo`, validateUserOptions);

		if (!validateUserResponse.ok) {
			throw new Error('Failed Requesting Validated User Data')
		}



		let userSearchOptions = {
			method: 'GET',
			headers: { authorization: `Bearer ${clientToken}` }
		}
		const userSearchResponse = await fetch(`https://dev-h7163bsxqf345cvn.us.auth0.com/api/v2/users?q=email:\"${email}\"&search_engine=v2`, userSearchOptions);

		if (!userSearchResponse.ok) {
			throw new Error('Failed requesting User Data')
		}

		const userData = await userSearchResponse.json();
		user = userData[0];

		//END **

		//Callback if user is found
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
	}
	





	//START SQL USER SEARCH

	let connection = mysql.createConnection({
		host: 'db-test-1.cluster-cbhruwduchhn.us-west-2.rds.amazonaws.com',
		user: 'prodroot',
		password: 'mypassword',
		multipleStatements: true,
		insureAuth: true
	});


	function handleDisconnect() {
		connection = mysql.createConnection({
			host: 'db-test-1.cluster-cbhruwduchhn.us-west-2.rds.amazonaws.com',
			user: 'prodroot',
			password: 'mypassword',
			multipleStatements: true,
			insureAuth: true
		});

		connection.connect(function (err) {
			if (err) {
				console.log('error when connecting to db:', err);
				setTimeout(handleDisconnect, 2000);
			}
		});

		connection.on('error', function (err) {
			console.log('db error', err);
			if (err.code === 'PROTOCOL_CONNECTION_LOST') {
				handleDisconnect();
			} else {
				throw err;
			}
		});
	}

	handleDisconnect();



	let query;
	function buildQuery() {
		query = `SELECT * FROM userStore.users WHERE email = \'${email}\'`;
	}
	buildQuery();


	connection.query(query, (err, results) => {
		if (err) {
			return callback(err);
		}

		if (results.length === 0) {
			return callback(new WrongUsernameOrPasswordError(email));
		}

		user = results[0];

		// console.log(user);

		bcrypt.compare(password, user.password, async function (err, isValid) {
			if (err || !isValid) return callback(err || new WrongUsernameOrPasswordError(email));

			if (isValid) {

				
				await fetch(`https://dev-h7163bsxqf345cvn.us.auth0.com/api/v2/users`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', authorization: `Bearer ${clientToken}` },
					body: JSON.stringify({
						email: `${user.email}`,
						user_metadata: {},
						blocked: false,
						email_verified: false,
						app_metadata: {},
						given_name: `${user.first_name}`,
						family_name: `${user.last_name}`,
						name: `${user.email}`,
						nickname: `${user.first_name}`,
						user_id: `${user.id}`,
						connection: "auth0-default-connection",
						password: `${password}`,
						verify_email: false,

					})
				})
				
				

				return callback(null, {
					user_id: user.id.toString(),
					username: user.username,
					email: user.email,
					connection: "auth0-default-connection"
				});
			}
		});
	});
}


