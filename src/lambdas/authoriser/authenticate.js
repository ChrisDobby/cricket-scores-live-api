import dotenv from 'dotenv';

import jwksRsa from 'jwks-rsa';
import jwt from 'jsonwebtoken';
import util from 'util';

dotenv.config();

const getPolicyDocument = (effect, resource) => {
    const policyDocument = {
        Version: '2012-10-17',
        Statement: [
            {
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: resource,
            },
        ],
    };
    return policyDocument;
};

const getToken = params => {
    if (!params.type || params.type !== 'TOKEN') {
        throw new Error('Expected "event.type" parameter to have value "TOKEN"');
    }

    const tokenString = params.authorizationToken;
    if (!tokenString) {
        throw new Error('Expected "event.authorizationToken" parameter to be set');
    }

    const match = tokenString.match(/^Bearer (.*)$/);
    if (!match || match.length < 2) {
        throw new Error(`Invalid Authorization token - ${tokenString} does not match "Bearer .*"`);
    }
    return match[1];
};

const jwtOptions = {
    audience: process.env.AUDIENCE,
    issuer: process.env.ISSUER,
};

export default params => {
    const token = getToken(params);

    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header || !decoded.header.kid) {
        throw new Error('invalid token');
    }

    const client = jwksRsa({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${process.env.ISSUER}.well-known/jwks.json`,
    });

    const getSigningKey = util.promisify(client.getSigningKey);
    return getSigningKey(decoded.header.kid)
        .then(key => {
            const signingKey = key.publicKey || key.rsaPublicKey;
            return jwt.verify(token, signingKey, jwtOptions);
        })
        .then(decoded => ({
            principalId: decoded.sub,
            policyDocument: getPolicyDocument('Allow', params.methodArn),
            context: { scope: decoded.scope },
        }));
};
