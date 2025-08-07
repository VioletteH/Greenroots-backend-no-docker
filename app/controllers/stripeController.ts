import { NextFunction, Request, Response } from "express";
import Stripe from "stripe";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../middlewares/errorHandler";

const stripe = (() => {
    if (!process.env.STRIPE) {
        throw new Error("Stripe API key is not defined in environment variables");
    }
    return new Stripe(process.env.STRIPE, { apiVersion: '2025-03-31.basil' });
})();

const stripeController = {
    
    intent : catchAsync (async (req: Request, res: Response, next: NextFunction) => {
        const { amount, currency } = req.body;
        if (!amount || !currency) {
            return next(new AppError("Amount and currency are required", 400));
        }
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency,
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            res.status(200).json({clientSecret: paymentIntent.client_secret,});
        } catch (error) {
            return next(new AppError(`Payment intent creation failed: ${(error as Error).message}`, 500));
          }
    })

}

export default stripeController;