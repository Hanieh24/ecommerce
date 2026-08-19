const Stripe = require('stripe');
const db = require('../config/database');
const { markOrderPaidFromStripeSession } = require('./orderController');
const { ensureOrderSchema } = require('../services/orderSchemaService');

const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

async function handleStripeWebhook(req, res) {
    try {
        await ensureOrderSchema();

        if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
            return res.status(500).json({
                message: 'Stripe webhook não configurado.'
            });
        }

        const signature = req.headers['stripe-signature'];
        const event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        if (event.type === 'checkout.session.completed') {
            await markOrderPaidFromStripeSession(db, event.data.object);
        }

        res.json({
            received: true
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            message: 'Webhook do Stripe inválido.'
        });
    }
}

module.exports = {
    handleStripeWebhook
};
