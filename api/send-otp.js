import nodemailer from "nodemailer";
import { otpStore } from "../utils/supabase-otp.js";

export default async function handler(req, res) {
  try {
    // Enable CORS for client integration
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

