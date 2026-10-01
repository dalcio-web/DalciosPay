import mongoose from 'mongoose';

// MongoDB schemas for subdocuments to match AppState / MonthData typescript types
const ExpenseSchema = new mongoose.Schema({
  id: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, enum: ['Fixas', 'Variáveis'], required: true },
  paid: { type: Boolean, default: false },
  dueDate: { type: String },
  installmentNumber: { type: Number },
  totalInstallments: { type: Number },
  paymentMethod: { type: String },
  receiptUrl: { type: String },
  splitFromId: { type: String },
  splitFromDescription: { type: String }
});

const ExtraIncomeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String }
});

const PiggyBankEntrySchema = new mongoose.Schema({
  id: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String }
});

const InvestmentEntrySchema = new mongoose.Schema({
  id: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String },
  type: { type: String },
  institution: { type: String },
  splitFromId: { type: String },
  splitFromDescription: { type: String },
  notes: { type: String }
});

// Primary Month Schema
const MonthSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  monthId: { type: String, required: true, index: true }, // Format: YYYY-MM
  salary: { type: Number, default: 0 },
  expenses: [ExpenseSchema],
  extraIncomes: [ExtraIncomeSchema],
  piggyBank: [PiggyBankEntrySchema],
  investments: [InvestmentEntrySchema],
  updatedAt: { type: Date, default: Date.now }
});

// Composite index to ensure quick lookups and unique constraints
MonthSchema.index({ userId: 1, monthId: 1 }, { unique: true });

export const MongoDBMonth = mongoose.models.Month || mongoose.model('Month', MonthSchema);

let isConnected = false;

export async function connectToMongoDB() {
  if (isConnected) {
    return true;
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn('[MongoDB] MONGODB_URI/MONGO_URI environment variable is not defined.');
    return false;
  }

  try {
    // Prevent multiple connections during internal Dev Server reloads
    if (mongoose.connection.readyState >= 1) {
      isConnected = true;
      return true;
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000, // Quick timeout to prevent server hang if credentials fail
    });

    isConnected = true;
    console.log('[MongoDB] Connected successfully to Database.');
    return true;
  } catch (err: any) {
    console.error('[MongoDB] Connection error failed:', err.message);
    return false;
  }
}
