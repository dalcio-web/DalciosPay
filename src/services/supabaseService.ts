
import { supabase } from '../lib/supabase';
import { MonthData, Expense, ExtraIncome, PiggyBankEntry } from '../types';

export const supabaseService = {
  async getMonthData(userId: string, monthId: string): Promise<MonthData | null> {
    const { data: month, error: monthError } = await supabase
      .from('months')
      .select('*')
      .eq('user_id', userId)
      .eq('month_id', monthId)
      .single();

    if (monthError && monthError.code !== 'PGRST116') throw monthError;
    if (!month) return null;

    const [expensesRes, incomesRes, piggyRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('month_id', month.id),
      supabase.from('extra_incomes').select('*').eq('month_id', month.id),
      supabase.from('piggy_bank').select('*').eq('month_id', month.id)
    ]);

    return {
      salary: month.salary,
      expenses: expensesRes.data?.map(e => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount),
        category: e.category,
        paid: e.paid,
        dueDate: e.due_date,
        installmentNumber: e.installment_number,
        totalInstallments: e.total_installments
      })) || [],
      extraIncomes: incomesRes.data?.map(i => ({
        id: i.id,
        description: i.description,
        amount: Number(i.amount),
        date: i.date
      })) || [],
      piggyBank: piggyRes.data?.map(p => ({
        id: p.id,
        description: p.description,
        amount: Number(p.amount),
        date: p.date
      })) || [],
      investments: []
    };
  },

  async saveMonthData(userId: string, month_id: string, data: MonthData) {
    console.log(`[DEBUG] Início saveMonthData para ${month_id}. User: ${userId}`);
    
    // Verificação extra de sanidade: o cliente tem sessão AGORA?
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("[DEBUG] CLIENTE SEM SESSÃO ATIVA no momento do saveMonthData!");
    } else {
      console.log("[DEBUG] Sessão ativa encontrada no client. UID no JWT:", session.user.id);
      if (session.user.id !== userId) {
        console.warn("[DEBUG] Mismatch entre userId passado e ID da sessão!", { passed: userId, session: session.user.id });
      }
    }

    // 1. Try to find existing month
    const { data: existingMonth, error: fetchError } = await supabase
      .from('months')
      .select('id')
      .eq('user_id', userId)
      .eq('month_id', month_id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error checking for existing month:", fetchError);
      throw new Error(`Erro ao verificar mês: ${fetchError.message}`);
    }

    let month;
    if (existingMonth) {
      // Update existing
      console.log(`Updating existing month ${existingMonth.id}`);
      const { data: updatedMonth, error: updateError } = await supabase
        .from('months')
        .update({ 
          salary: data.salary,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMonth.id)
        .select()
        .single();
      
      if (updateError) {
        console.error("Error updating month:", updateError);
        if (updateError.message.includes('row-level security')) {
          throw new Error(`Erro de RLS no Update (Tabela: months). O usuário ${userId} não tem permissão para alterar o mês ${month_id} (ID: ${existingMonth.id}).`);
        }
        throw new Error(`Erro ao atualizar mês: ${updateError.message}`);
      }
      month = updatedMonth;
    } else {
      // Insert new
      console.log(`Inserting new month for ${month_id}`);
      const { data: insertedMonth, error: insertError } = await supabase
        .from('months')
        .insert({ 
          user_id: userId,
          month_id: month_id,
          salary: data.salary,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Error inserting month:", insertError);
        if (insertError.message.includes('row-level security')) {
          throw new Error(`Erro de RLS no Insert (Tabela: months). Verifique se o ID ${userId} é o seu ID atual.`);
        }
        throw new Error(`Erro ao criar mês: ${insertError.message}`);
      }
      month = insertedMonth;
    }

    if (!month) throw new Error("Falha ao obter ID do mês (registro não retornado).");

    // 2. Sync sub-tables (Expenses, Incomes, Piggy Bank)
    try {
      console.log(`Cleaning old records for month ${month.id}...`);
      // Excluímos os registros antigos antes de inserir os novos para manter a sincronia
      await Promise.all([
        supabase.from('expenses').delete().eq('month_id', month.id),
        supabase.from('extra_incomes').delete().eq('month_id', month.id),
        supabase.from('piggy_bank').delete().eq('month_id', month.id)
      ]);
    } catch (e) {
      console.error("Error during sub-table cleanup:", e);
      // Não lançamos erro aqui para tentar prosseguir com a inserção se possível
    }

    const jobs = [];
    if (data.expenses.length > 0) {
      jobs.push(supabase.from('expenses').upsert(data.expenses.map(e => ({
        id: e.id,
        month_id: month.id,
        user_id: userId,
        description: e.description,
        amount: e.amount,
        category: e.category,
        paid: e.paid,
        due_date: e.dueDate || null,
        installment_number: e.installmentNumber || null,
        total_installments: e.totalInstallments || null
      })), { onConflict: 'id' }));
    }

    if (data.extraIncomes.length > 0) {
      jobs.push(supabase.from('extra_incomes').upsert(data.extraIncomes.map(i => ({
        id: i.id,
        month_id: month.id,
        user_id: userId,
        description: i.description,
        amount: i.amount,
        date: i.date || null
      })), { onConflict: 'id' }));
    }

    if (data.piggyBank.length > 0) {
      jobs.push(supabase.from('piggy_bank').upsert(data.piggyBank.map(p => ({
        id: p.id,
        month_id: month.id,
        user_id: userId,
        description: p.description,
        amount: p.amount,
        date: p.date || null
      })), { onConflict: 'id' }));
    }

    const results = await Promise.all(jobs);
    const firstError = results.find(r => r.error);
    if (firstError) {
      console.error("Error inserting sub-records:", firstError.error);
      throw new Error(`Erro ao salvar registros detalhados: ${firstError.error.message}`);
    }
  },

  async getAllMonthsData(userId: string): Promise<{ [key: string]: MonthData }> {
    const { data: months, error: monthsError } = await supabase
      .from('months')
      .select('*')
      .eq('user_id', userId);

    if (monthsError) throw monthsError;
    if (!months || months.length === 0) return {};

    const monthIds = months.map(m => m.id);

    const [expensesRes, incomesRes, piggyRes] = await Promise.all([
      supabase.from('expenses').select('*').in('month_id', monthIds),
      supabase.from('extra_incomes').select('*').in('month_id', monthIds),
      supabase.from('piggy_bank').select('*').in('month_id', monthIds)
    ]);

    const result: { [key: string]: MonthData } = {};

    months.forEach(month => {
      result[month.month_id] = {
        salary: month.salary,
        expenses: expensesRes.data?.filter(e => e.month_id === month.id).map(e => ({
          id: e.id,
          description: e.description,
          amount: Number(e.amount),
          category: e.category,
          paid: e.paid,
          dueDate: e.due_date,
          installmentNumber: e.installment_number,
          totalInstallments: e.total_installments
        })) || [],
        extraIncomes: incomesRes.data?.filter(i => i.month_id === month.id).map(i => ({
          id: i.id,
          description: i.description,
          amount: Number(i.amount),
          date: i.date
        })) || [],
        piggyBank: piggyRes.data?.filter(p => p.month_id === month.id).map(p => ({
          id: p.id,
          description: p.description,
          amount: Number(p.amount),
          date: p.date
        })) || [],
        investments: []
      };
    });

    return result;
  }
};
