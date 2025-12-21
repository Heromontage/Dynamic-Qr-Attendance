// Firebase Cloud Functions for Dynamic QR Attendance System
// Deploy: firebase deploy --only functions
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// const db = admin.firestore();

// For emulator: disable SSL verification
if (process.env.FUNCTIONS_EMULATOR === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// Google Generative AI (Gemini) Setup
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(functions.config().gemini.apikey);

