const { body, validationResult } = require('express-validator');

const validateUser = [
    body('username')
        .notEmpty().withMessage('El nombre de usuario es obligatorio.')
        .isString().withMessage('El nombre de usuario debe ser una cadena de texto.'),

    body('password')
        .notEmpty().withMessage('La contraseña es obligatoria.')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const {msg} = errors.array()[0];
            
            const valiteError = new Error(msg);
            valiteError.statusCode = 400;
            valiteError.status = 'fail';
            valiteError.validationError = true;
            return next(valiteError);
        }
        next();
    }
];

module.exports = {
    validateUser
};