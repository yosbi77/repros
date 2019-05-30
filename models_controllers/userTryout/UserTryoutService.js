const jwt = require('jsonwebtoken');

const config = require('../../config.json');
const db = require('../../_helpers/db');
const RefreshToken = db.RefreshToken;
const User = db.User;
const Tryout = db.Tryout;
const UserTryout = db.UserTryout;
const QnA = db.QnA;
const QnALookupTopic = db.QnALookupTopic;
const Product = db.Product;
const UserProduct = db.UserProduct;

const verifyRequest = async (token, callback) => {
	if(token.startsWith("Bearer ")) {
		token = token.substring(7);
		const decoded = await jwt.verify(token, config.secret, {
			algorithm: "HS512",
			expiresIn: 15 * 60,
			audience: "http://dokcbt.com",
			issuer: "DokCBT"
		}, (err, payload) => {
			if (err) {
				return {
					success: false,
					msg: 'Unidentified token'
				}
			} else return payload;
		});
		const refreshToken = await RefreshToken.findOne({username: decoded.username});
		const authUser = await User.findById(decoded.sub);

		if (decoded.exp <= Date.now().valueOf() / 1000) {
			return {
				success: false,
				msg: 'Token expired'
			}
		}
		if (
			authUser && decoded.username === authUser.username && decoded.type === authUser.type && decoded.isActive === authUser.isActive && decoded.isBlacklisted === authUser.isBlacklisted &&
			refreshToken && decoded && decoded.isActive === "Active" && !decoded.isBlacklisted && decoded.exp > Date.now().valueOf() / 1000
		) return callback(decoded);
		else return {
			success: false,
			msg: 'Unauthorized'
		}
	} else return {
		success: false,
		msg: 'Unauthorized'
	}
};

const adminPrivilege = async (decoded, callback) => {
	if (decoded.type === "Superadmin" || decoded.type === "Admin") return callback(decoded);
	else return {
		success: false,
		msg: 'Unauthorized'
	}
};

const clientCreatePrivilege = async (userTryoutParam, decoded, callback) => {
	if (decoded.type === "Superadmin" || decoded.type === "Admin" || (decoded.type === "Client" && decoded.sub === userTryoutParam.m_users_id)) return callback(decoded);
	else return {
		success: false,
		msg: 'Unauthorized'
	}
};

const clientQueryPrivilege = async (query, decoded, callback) => {
	if (decoded.type === "Superadmin" || decoded.type === "Admin" || (decoded.type === "Client" && decoded.sub === query.m_users_id)) return callback(decoded);
	else return {
		success: false,
		msg: 'Unauthorized'
	}
};

const clientIdPrivilege = async (id, decoded, callback) => {
	const userTryout = await UserTryout.findById(id);

	if (decoded.type === "Superadmin" || decoded.type === "Admin" || (decoded.type === "Client" && userTryout && decoded.sub === userTryout.m_users_id.toString())) return callback(decoded);
	else return {
		success: false,
		msg: 'Unauthorized'
	}
};

const submit = async (id, token) => await verifyRequest(token, async (decoded) => {
	return await clientIdPrivilege(id, decoded, async (decoded) => {
		const userTryout = await UserTryout.findById(id);
		const tryout = await Tryout.findById(userTryout.m_tryouts_id);
		let newArr = [];

		for (let i = 0; i < tryout.questions.length; i++) {
			if (!await UserTryout.findOne({_id: id, 'answers.m_qnas_id': tryout.questions[i]})) {
				newArr.push({
					m_qnas_id: tryout.questions[i],
					answer: -1,
					status: "Certain"
				});
			}
		}

		await UserTryout.update({_id: id}, {$push: {answers: {$each: newArr}}});

		for (let i = 0; i < tryout.questions.length; i++) {
			const updatedUserTryout = await UserTryout.findById(id);
			const aIndex = await updatedUserTryout.answers.findIndex(item => item.m_qnas_id.toString() === tryout.questions[i].toString());

			const qna = await QnA.findById(tryout.questions[i]);
			const answer = updatedUserTryout.answers[aIndex].answer;
			let correct = false;

			if (answer === qna.correctInd) correct = true;

			if (correct) await UserTryout.update({
				_id: id,
				'answers.m_qnas_id': tryout.questions[i]
			}, {$set: {'answers.$.result': 'Correct'}});
			else await UserTryout.update({
				_id: id,
				'answers.m_qnas_id': tryout.questions[i]
			}, {$set: {'answers.$.result': 'Incorrect'}});
		}

		await UserTryout.update({_id: id}, {$set: {analysis: {}}});

		const updatedUserTryout2 = await UserTryout.findById(id);

		let incorrectCounters = [];
		let topics = await QnALookupTopic.find({isDeleted: 0});
		for (let i = 0; i < topics.length; i++) incorrectCounters.push({topic: topics[i]._id, count: 0});

		let correctAnswers = 0;
		for (let i = 0; i < updatedUserTryout2.answers.length; i++) {
			if (updatedUserTryout2.answers[i].result === "Correct") correctAnswers++;// updatedUserTryout2.analysis.finalScore += 0.5;
			if (updatedUserTryout2.answers[i].result === "Incorrect") {
				const qna = await QnA.findById(updatedUserTryout2.answers[i].m_qnas_id);
				const qnaLookupTopic = await QnALookupTopic.findById(qna.topic);
				const topicIndex = await incorrectCounters.findIndex((item) => item.topic.toString() === qnaLookupTopic._id.toString());

				incorrectCounters[topicIndex].count++;
				if (updatedUserTryout2.answers[i].answer === -1) updatedUserTryout2.analysis.emptyAnswerCounter++;
			}
		}
		updatedUserTryout2.analysis.finalScore = correctAnswers / tryout.questions.length * 100;
		updatedUserTryout2.analysis.incorrectCounters = incorrectCounters;

		await updatedUserTryout2.save();

		const updatedUserTryout3 = await UserTryout.findById(id);

		for (let i = 0; i < topics.length; i++) {
			const topicCountIndex = await incorrectCounters.findIndex((item) => item.topic.toString() === topics[i]._id.toString());
			const topicParamIndex = await tryout.params.findIndex((item) => item.topic.toString() === topics[i]._id.toString());
			const tryoutTopicParam = tryout.params[topicParamIndex];
			if (incorrectCounters[topicCountIndex].count > tryoutTopicParam.maxIncorrect) updatedUserTryout3.analysis.badTopics.push({topic: tryoutTopicParam.topic});
		}

		updatedUserTryout3.updated = new Date();
		updatedUserTryout3.updatedBy = decoded.sub;

		// save updatedUserTryout3
		await updatedUserTryout3.save();
	})
});

const getExplanation = async (id, token) => await verifyRequest(token, async (decoded) => {
	return await clientIdPrivilege(id, decoded, async () => {
		return await UserTryout.findOne({_id: id, isDeleted: 0})
			.populate('createdBy updatedBy', 'username')
			.populate({
				path: 'm_tryouts_id', populate: {
					path: 'questions', model: 'm_qnas', select: 'code topic question answers correctInd explanation', populate: {
						path: 'topic', model: 'l_qna_topics', select: 'topic'
					}
				}
			})
			// .populate('m_tryouts_id.params.topic', 'topic')
			.populate({
				path: 'm_tryouts_id', populate: {
					path: 'params.topic', model: 'l_qna_topics', select: 'topic'
				}
			})
			.populate('analysis.incorrectCounters.topic', 'topic')
			.populate('analysis.badTopics.topic', 'topic'); // return await UserTryout.findById(id);
	})
});

const create = async (userTryoutParam, token) => await verifyRequest(token, async (decoded) => {
	return await clientCreatePrivilege(userTryoutParam, decoded, async (decoded) => {
		const user = await User.findById(userTryoutParam.m_users_id);
		const tryout = await Tryout.findById(userTryoutParam.m_tryouts_id);
		const products = await Product.find({"items.tryouts.m_tryouts_id": userTryoutParam.m_tryouts_id});
		let productCheck = false;

		if (products.length > 0) {
			for (const i in products) {
				const userProduct = await UserProduct.findOne({m_users_id: userTryoutParam.m_users_id, "products.m_products_id": products[i]._id});
				if (userProduct) productCheck = true;
			}
		}

		if (productCheck) {
			if (!user) return {
				success: false,
				msg: 'User not found'
			};
			if (!tryout) return {
				success: false,
				msg: 'Tryout not found'
			};
			if (await UserTryout.findOne({
				m_users_id: userTryoutParam.m_users_id,
				m_tryouts_id: userTryoutParam.m_tryouts_id
			})) return {
				success: false,
				msg: 'UserTryout already existed'
			};

			userTryoutParam.created = new Date();
			userTryoutParam.updated = new Date();
			userTryoutParam.createdBy = decoded.sub;
			userTryoutParam.updatedBy = decoded.sub;
			userTryoutParam.isDeleted = 0;
			userTryoutParam.timeLeft = tryout.time;

			const userTryout = new UserTryout(userTryoutParam);

			// save userTryout
			await userTryout.save();
		} else return {
			success: false,
			msg: 'No Product with this Tryout'
		}
	})
});

const getAll = async (token) => await verifyRequest(token, async (decoded) => await adminPrivilege(decoded, async () => await UserTryout.find({isDeleted: 0}).populate('createdBy updatedBy', 'username')));

const getAllDeleted = async (token) => await verifyRequest(token, async (decoded) => await adminPrivilege(decoded, async () => await UserTryout.find({isDeleted: 1}).populate('createdBy updatedBy', 'username')));

const getByQuery = async (query, token) => await verifyRequest(token, async (decoded) => {
	return await clientQueryPrivilege(query, decoded, async () => {
		if (Object.entries(query).length < 1 || Object.entries(query).length > 2) return {
			success: false,
			msg: 'Unauthorized'
		};

		for (const name in query) {
			if (!/^m_users_id|m_tryouts_id$/.test(name)) return {
				success: false,
				msg: 'Unauthorized'
			};
		}
		query.isDeleted = 0;
		return await UserTryout.find(query)
			.populate('createdBy updatedBy', 'username')
			.populate('m_tryouts_id', 'title time');
	})
});

const getById = async (id, token) => await verifyRequest(token, async (decoded) => {
	return await clientIdPrivilege(id, decoded, async () => {
		return await UserTryout.findOne({_id: id, isDeleted: 0})
			.populate('createdBy updatedBy', 'username')
			.populate({
				path: 'm_tryouts_id', select: 'questions', populate: {
					path: 'questions', model: 'm_qnas', select: 'code question answers'
				}
			}); // return await UserTryout.findById(id);
	})
});

const update = async (id, userTryoutParam, token) => await verifyRequest(token, async (decoded) => {
	return await clientIdPrivilege(id, decoded, async (decoded) => {
		const userTryout = await UserTryout.findById(id);

		// validate
		if (!userTryout) return {
			success: false,
			msg: 'UserTryout not found'
		}; // throw 'UserTryout not found';

		userTryoutParam.updated = new Date();
		userTryoutParam.updatedBy = decoded.sub;

		// copy userTryoutParam properties to userTryout
		Object.assign(userTryout, userTryoutParam);

		await userTryout.save();
	})
});

const patch = async (id, userTryoutParam, token) => await verifyRequest(token, async (decoded) => {
	return await clientIdPrivilege(id, decoded, async (decoded) => {
		const userTryout = await UserTryout.findById(id);
		// validate
		if (!userTryout) return {
			success: false,
			msg: 'UserTryout not found'
		}; // throw 'UserTryout not found';

		for (const name in userTryoutParam) {
			if (!/^answers|timeLeft|isDeleted$/.test(name)) return {
				success: false,
				msg: 'Unauthorized'
			};
		}

		if (userTryoutParam.answers) {
			const tryout = await Tryout.findById(userTryout.m_tryouts_id);

			const matchedId = tryout.questions.indexOf(userTryoutParam.answers.m_qnas_id);
			if (matchedId === -1) return {
				success: false,
				msg: 'QnA with ID ' + userTryoutParam.answers.m_qnas_id + ' not found'
			};

			if (typeof userTryoutParam.answers.answer === "undefined" || typeof userTryoutParam.answers.status === "undefined") return {
				success: false,
				msg: 'No answer and status in the input'
			};

			let matchedQ = false;
			if (typeof userTryout.answers !== "undefined" && userTryout.answers.length > 0) {
				for (let i = 0; i < userTryout.answers.length; i++) {
					if (userTryoutParam.answers.m_qnas_id === userTryout.answers[i].m_qnas_id.toString()) {
						userTryout.answers[i] = userTryoutParam.answers;
						matchedQ = true;
						break;
					}
				}
			}

			if (matchedQ === false) userTryout.answers.push(userTryoutParam.answers);

			delete userTryoutParam["answers"];
		}

		userTryoutParam.updated = new Date();
		userTryoutParam.updatedBy = decoded.sub;
		delete userTryoutParam["answers"];

		// copy userTryoutParam properties to userTryout
		Object.assign(userTryout, userTryoutParam);

		await userTryout.save();
	})
});

const _delete = async (id, token) => await verifyRequest(token, async (decoded) => {
	return await adminPrivilege(decoded, async () => {
		const userTryout = await UserTryout.findById(id);

		if (!userTryout) return {
			success: false,
			msg: 'UserTryout not found'
		};

		await UserTryout.findByIdAndRemove(id);
	})
});

module.exports = {
	submit,
	getExplanation,
	create,
	getAll,
	getAllDeleted,
	getByQuery,
	getById,
	update,
	patch,
	delete: _delete
};