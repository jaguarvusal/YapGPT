import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import dotenv from 'dotenv';
dotenv.config();
let lastAuthenticatedUser = null;
export const authenticateToken = ({ req }) => {
    let token = req.body.token || req.query.token || req.headers.authorization;
    if (req.headers.authorization) {
        token = token.split(' ').pop().trim();
    }
    if (!token) {
        return req;
    }
    try {
        const { data } = jwt.verify(token, process.env.JWT_SECRET_KEY || '', { maxAge: '2hr' });
        // Only log if the authenticated user has changed
        if (JSON.stringify(lastAuthenticatedUser) !== JSON.stringify(data)) {
            console.log('Authenticated user:', data);
            lastAuthenticatedUser = data;
        }
        req.user = data;
    }
    catch (err) {
        console.log('Invalid token:', err);
        throw new AuthenticationError('Invalid token');
    }
    return req;
};
export const signToken = (username, email, _id) => {
    const payload = { username, email, _id };
    const secretKey = process.env.JWT_SECRET_KEY;
    return jwt.sign({ data: payload }, secretKey, { expiresIn: '2h' });
};
export class AuthenticationError extends GraphQLError {
    constructor(message = 'Not authenticated') {
        super(message, {
            extensions: {
                code: 'UNAUTHENTICATED',
            },
        });
        Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
    }
}
;
