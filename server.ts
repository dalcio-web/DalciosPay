import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { getAuthenticatedUser, requireFirebaseAuth, type AuthenticatedRequest } from "./src/server/auth";
import { PERMISSIONS, requirePermission } from "./src/server/rbac";
import { getSelectedDataBackend, isMariaDbConfigured } from "./src/server/dataBackend";
import {
  checkMariaDbConnection,
  getAllMariaDbMonths,
  saveAllMariaDbMonths,
  saveMariaDbMonth,
} from "./src/server/mariaDbFinancialRepository";

dotenv.config();

console.log("[Server Startup] Variáveis encontradas:", Object.keys(process.env).filter(k => k.startsWith('VITE_') || k.includes('SUPABASE')));

const app = express();
const PORT = Number(process.env.PORT || 3000);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('PORT inválida.');
}

// Increase limit of body parsers to handle large migration payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Support both standard Vite names and the specific ones provided by the user
const cleanUrl = (val: any): string | null => {
  if (!val || typeof val !== 'string') return null;
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  if (s === '' || s === 'undefined' || s === 'null' || !s.startsWith('http')) {
    return null;
  }
  return s;
};

const cleanKey = (val: any): string | null => {
  if (!val || typeof val !== 'string') return null;
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  if (s === '' || s === 'undefined' || s === 'null') {
    return null;
  }
  return s;
};

const getSupabaseConfig = () => {
  const rawUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const rawKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANO || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  return {
    url: cleanUrl(rawUrl),
    key: cleanKey(rawKey)
  };
};

let supabaseInstance: any = null;
const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;
  const { url, key } = getSupabaseConfig();
  if (url && key) {
    try {
      supabaseInstance = createClient(url, key);
      return supabaseInstance;
    } catch (err: any) {
      console.warn("[Server Supabase] Failed to initialize Supabase client safely:", err.message);
      return null;
    }
  }
  return null;
};

// API routes
import { connectToMongoDB, MongoDBMonth as MongoDBMonthRaw } from "./src/lib/mongodb";
const MongoDBMonth = MongoDBMonthRaw as any;

// Middleware/helper to verify JWT or auth token
const getAuthenticatedUserId = async (req: express.Request): Promise<string | null> => {
  const user = await getAuthenticatedUser(req);
  return user?.uid ?? null;
};

// Public configuration endpoint
app.get("/api/config", (req, res) => {
  const config = getSupabaseConfig();
  res.json({
    supabaseUrl: config.url || null,
    supabaseAnonKey: config.key || null
  });
});

app.get("/api/auth/me", requireFirebaseAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    uid: req.authUser!.uid,
    email: req.authUser!.email ?? null,
    emailVerified: req.authUser!.email_verified ?? false,
  });
});

app.get(
  "/api/admin/security-check",
  requireFirebaseAuth,
  requirePermission(PERMISSIONS.ADMIN_ACCESS),
  (req: AuthenticatedRequest, res) => {
    res.json({ status: "ok", uid: req.authUser!.uid });
  },
);

// Returns status of database configurations
app.get("/api/db-status", async (req, res) => {
  try {
    const activeDb = getSelectedDataBackend();
    const mariaConfigured = isMariaDbConfigured();
    const mariaConnected = activeDb === 'mariadb' && mariaConfigured
      ? await checkMariaDbConnection()
      : false;
    const hasMongoUri = !!(process.env.MONGODB_URI || process.env.MONGO_URI);
    let mongoConnected = false;
    if (activeDb === 'mongodb' && hasMongoUri) {
      mongoConnected = await connectToMongoDB();
    }
    
    const supabaseClient = getSupabase();
    const config = getSupabaseConfig();
    const supabaseConfigured = !!(config.url && config.key);
    
    res.json({
      mariadb: {
        configured: mariaConfigured,
        connected: mariaConnected,
      },
      mongodb: {
        configured: hasMongoUri,
        connected: mongoConnected,
      },
      supabase: {
        configured: supabaseConfigured,
        connected: !!supabaseClient
      },
      activeDb,
    });
  } catch (err: any) {
    console.error("[API] Error in /api/db-status:", err);
    res.status(500).json({
      error: err.message,
      mariadb: { configured: isMariaDbConfigured(), connected: false },
      mongodb: { configured: false, connected: false },
      supabase: { configured: false, connected: false },
      activeDb: process.env.DATA_BACKEND || 'mongodb'
    });
  }
});

// GET all months from the explicitly selected financial backend.
app.get("/api/months", async (req, res) => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Sessão inválida ou não autorizado." });
  }

  try {
    if (getSelectedDataBackend() === 'mariadb') {
      return res.json(await getAllMariaDbMonths(userId));
    }

    const isConnected = await connectToMongoDB();
    if (!isConnected) {
      return res.status(503).json({ error: "Serviço MongoDB indisponível no momento." });
    }

    const documents = await MongoDBMonth.find({ userId });
    
    // Convert array of docs back to frontend lookup object: { [monthId]: MonthData }
    const result: { [key: string]: any } = {};
    documents.forEach(doc => {
      result[doc.monthId] = {
        salary: doc.salary,
        expenses: (doc.expenses || []).map((e: any) => ({
          id: e.id,
          description: e.description,
          amount: e.amount,
          category: e.category,
          paid: e.paid,
          dueDate: e.dueDate,
          installmentNumber: e.installmentNumber,
          totalInstallments: e.totalInstallments,
          paymentMethod: e.paymentMethod,
          receiptUrl: e.receiptUrl,
          splitFromId: e.splitFromId,
          splitFromDescription: e.splitFromDescription
        })),
        extraIncomes: (doc.extraIncomes || []).map((i: any) => ({
          id: i.id,
          description: i.description,
          amount: i.amount,
          date: i.date
        })),
        piggyBank: (doc.piggyBank || []).map((p: any) => ({
          id: p.id,
          description: p.description,
          amount: p.amount,
          date: p.date
        })),
        investments: (doc.investments || []).map((inv: any) => ({
          id: inv.id,
          description: inv.description,
          amount: inv.amount,
          date: inv.date,
          type: inv.type,
          institution: inv.institution,
          splitFromId: inv.splitFromId,
          splitFromDescription: inv.splitFromDescription,
          notes: inv.notes
        }))
      };
    });

    res.json(result);
  } catch (err: any) {
    console.error("[API] Error fetching months from MongoDB:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST to save/upsert a specific month in the selected financial backend.
app.post("/api/months/:monthId", async (req, res) => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }

  const { monthId } = req.params;
  const monthData = req.body;

  try {
    if (getSelectedDataBackend() === 'mariadb') {
      await saveMariaDbMonth(userId, monthId, monthData);
      return res.json({ status: "success", monthId });
    }

    const isConnected = await connectToMongoDB();
    if (!isConnected) {
      return res.status(503).json({ error: "Conexão com o MongoDB falhou." });
    }

    // Upsert Month doc
    const updatedDoc = await MongoDBMonth.findOneAndUpdate(
      { userId, monthId },
      {
        salary: monthData.salary,
        expenses: monthData.expenses || [],
        extraIncomes: monthData.extraIncomes || [],
        piggyBank: monthData.piggyBank || [],
        investments: monthData.investments || [],
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    res.json({ status: "success", monthId: updatedDoc.monthId });
  } catch (err: any) {
    console.error("[API] Error saving month to MongoDB:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST to migrate all data (a batch operation)
app.post("/api/migrate-all", async (req, res) => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }

  const { months } = req.body;
  if (!months || typeof months !== 'object') {
    return res.status(400).json({ error: "Formato de dados para migração inválido." });
  }

  try {
    if (getSelectedDataBackend() === 'mariadb') {
      await saveAllMariaDbMonths(userId, months);
      return res.json({ status: "success", message: `${Object.keys(months).length} meses gravados no MariaDB.` });
    }

    const isConnected = await connectToMongoDB();
    if (!isConnected) {
      return res.status(503).json({ error: "Conexão com o MongoDB falhou." });
    }

    const operations = Object.entries(months).map(([monthId, data]: [string, any]) => {
      return MongoDBMonth.findOneAndUpdate(
        { userId, monthId },
        {
          salary: data.salary,
          expenses: data.expenses || [],
          extraIncomes: data.extraIncomes || [],
          piggyBank: data.piggyBank || [],
          investments: data.investments || [],
          updatedAt: new Date()
        },
        { upsert: true }
      );
    });

    await Promise.all(operations);
    res.json({ status: "success", message: `${operations.length} meses migrados com sucesso!` });
  } catch (err: any) {
    console.error("[API] Error in batch migration to MongoDB:", err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para manter o Supabase ativo via ping externo
app.get("/api/keep-alive", async (req, res) => {
  console.log("[Keep-alive] Recebendo ping de atividade");
  
  const supabase = getSupabase();
  
  if (!supabase) {
    const config = getSupabaseConfig();
    return res.status(500).json({ 
      status: "error", 
      message: "Configuração do Supabase incompleta no servidor.",
      check: {
        url_presente: !!config.url,
        key_presente: !!config.key
      },
      instruction: "Verifique se as chaves VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY foram adicionadas corretamente no menu Secrets."
    });
  }

  try {
    // Realiza uma operação simples de leitura para manter o banco ativo
    const { error } = await supabase
      .from('months')
      .select('count', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      console.error("[Keep-alive] Erro na consulta Supabase:", error.message);
      throw error;
    }
    
    console.log("[Keep-alive] Sucesso: Banco de dados respondeu.");
    res.json({ 
      status: "ok", 
      message: "Atividade registrada com sucesso",
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[Keep-alive] Falha crítica:", err.message);
    res.status(500).json({ 
      status: "error", 
      message: err.message 
    });
  }
});

// Endpoint para análise e leitura inteligente de recibos, cupons fiscais e comprovantes via Gemini Vision
app.post("/api/analyze-receipt", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Imagem do recibo não fornecida." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Chave GEMINI_API_KEY não configurada no servidor." });
    }

    // Clean base64 if it has data URL prefix
    let cleanBase64 = imageBase64;
    let detectedMime = mimeType || 'image/jpeg';
    if (cleanBase64.includes(';base64,')) {
      const parts = cleanBase64.split(';base64,');
      detectedMime = parts[0].replace('data:', '') || detectedMime;
      cleanBase64 = parts[1];
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Você é um leitor especialista em recibos de compras, cupons fiscais (NFC-e, SAT, ECF), notas fiscais e comprovantes de pagamento bancários/Pix/cartão do Brasil e internacionais.
Analise a imagem deste recibo com máxima atenção.

Identifique e extraia:
1. amount: O valor total pago ou a pagar na compra (número decimal, ex: 85.90). Procure pelo 'Total', 'Valor Pago', 'Total a Pagar', 'Valor R$'.
2. description: Nome da loja, estabelecimento, supermercado, posto, restaurante ou fornecedor (ex: 'Supermercado Guanabara', 'Posto Shell', 'Drogaria Pacheco', 'Restaurante Sabor').
3. date: A data da transação ou compra no formato YYYY-MM-DD (ex: 2026-09-28). Se não encontrar o ano, use o ano corrente.
4. paymentMethod: A forma de pagamento indicada no comprovante:
   - 'pix' (se for Pix ou transferência instantânea)
   - 'credit_card' (se indicar Cartão de Crédito, Crédito à vista ou parcelado)
   - 'boleto' (se for Boleto Bancário)
5. paymentStatus: 'paid' (se for um comprovante de pagamento efetuado, cupom fiscal emitido ou nota paga) ou 'pending' (se for um boleto a vencer ou fatura aberta). Na dúvida em recibos de loja física, considere 'paid'.
6. category: Sugira 'Variáveis' (para supermercado, alimentação, lazer, farmácia, transporte, combustível) ou 'Fixas' (para contas de consumo regular como luz, água, gás, internet, plano de saúde, aluguel).
7. installments: Quantidade de parcelas se for compra parcelada no cartão (ex: 1 se à vista, 2 se 2x, etc.).
8. itemsSummary: Um resumo sucinto dos itens comprados, se visíveis (ex: 'Compras de supermercado (4 itens)' ou 'Abastecimento Gasolina').

Retorne exatamente no formato JSON com esses campos.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: detectedMime,
            data: cleanBase64
          }
        },
        {
          text: prompt
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "Valor total do recibo" },
            description: { type: Type.STRING, description: "Nome do estabelecimento ou compra" },
            date: { type: Type.STRING, description: "Data no formato YYYY-MM-DD" },
            paymentMethod: { 
              type: Type.STRING, 
              enum: ['pix', 'credit_card', 'boleto'] 
            },
            paymentStatus: {
              type: Type.STRING,
              enum: ['paid', 'pending']
            },
            category: { 
              type: Type.STRING, 
              enum: ['Fixas', 'Variáveis'] 
            },
            installments: { 
              type: Type.INTEGER 
            },
            itemsSummary: { 
              type: Type.STRING 
            }
          },
          required: ['amount', 'description', 'paymentMethod', 'category']
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      return res.status(500).json({ error: "Não foi possível ler o recibo." });
    }

    const parsedData = JSON.parse(resultText);
    res.json({
      success: true,
      data: parsedData
    });
  } catch (err: any) {
    console.error("[API] Error analyzing receipt with Gemini:", err);
    res.status(500).json({ 
      error: "Falha ao processar imagem do recibo: " + (err.message || "Erro desconhecido")
    });
  }
});

// Global error handler middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[ServerError Handler]", err);
  if (err instanceof SyntaxError && "status" in err && (err as any).status === 400 && "body" in err) {
    return res.status(400).json({ error: "Formato JSON inválido." });
  }
  return res.status(err.status || err.statusCode || 500).json({ 
    error: err.message || "Ocorreu um erro interno no servidor." 
  });
});

async function startServer() {
  // Configuração do middleware do Vite para desenvolvimento
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Modo Desenvolvimento: Vite carregado.");
  } else {
    // Servir arquivos estáticos em produção com cache-busting agressivo
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      etag: false,
      maxAge: 0,
      setHeaders: (res, filePath) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Modo Produção: Servindo arquivos estáticos de", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
