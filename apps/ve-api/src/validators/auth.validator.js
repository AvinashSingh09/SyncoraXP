const { body } = require('express-validator');

const registerValidator = [
    body('firstName')
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    body('designation')
        .optional({ checkFalsy: true }),
    body('company')
        .optional({ checkFalsy: true }),
    body('mobileNumber')
        .optional({ checkFalsy: true })
        .isLength({ min: 10, max: 10 }).withMessage('Mobile number must be exactly 10 digits')
        .isNumeric().withMessage('Mobile number must contain only numbers'),
    body('country')
        .optional({ checkFalsy: true }),
    body('state')
        .optional({ checkFalsy: true }),
    body('city')
        .optional({ checkFalsy: true }),
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Valid email is required'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character')
];

const loginValidator = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Valid email is required'),
    body('password')
        .notEmpty().withMessage('Password is required')
];

module.exports = {
    registerValidator,
    loginValidator
};
