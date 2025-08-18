const { body, param } = require('express-validator');

exports.validateOrderStatusUpdate = [
    param('id').isUUID().withMessage('Invlid order ID format'),
    body('status')
    .isIn(['Approved', 'Rejected'])
    .withMessage('Status must be either Approved or Rejected'),
    body('reason')
        .trim()
        .notEmpty()
        .withMessage('Reason is required')
        .isLength({ min: 10})
        .withMessage('Reason must be at least 10 characters long')

];