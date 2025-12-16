import { BetInputs, BetResult, KellyInputs, KellyResult, AggressivenessResult } from '../types';

/**
 * FUNÇÃO CORE: calcularEVPlus
 * 
 * Implementa a lógica de cálculo de EV+ para a aba "EV Finder".
 * Determina se há valor na aposta, o ROI (Yield) e a Odd Justa.
 * 
 * @param prob_packball_percentual - Probabilidade do Packball em % (Ex: 70.00).
 * @param odd_casa - Odd oferecida pela Casa (Ex: 1.55).
 * @param stake_aposta - Valor da Stake (Ex: 100.00).
 */
export function calcularEVPlus(
  prob_packball_percentual: number,
  odd_casa: number,
  stake_aposta: number
) {
  // 1. Probabilidade Decimal
  const prob_packball_decimal = prob_packball_percentual / 100;
  
  // Validação
  if (prob_packball_decimal <= 0 || prob_packball_decimal > 1) {
    return {
      odd_justa: 0,
      valor_esperado_reais: 0,
      roi_esperado_percentual: 0,
      status_ev: "DADOS INVÁLIDOS"
    };
  }

  // 2. Probabilidade de Perder
  const prob_perder_decimal = 1 - prob_packball_decimal;

  // 3. Odd Justa (Seu X)
  const odd_justa = 1 / prob_packball_decimal;

  // 4. EV em Reais (Valor Esperado)
  // Fórmula ajustada para EV Padrão: (Prob_Ganhar * Lucro) - (Prob_Perder * Stake)
  // Lucro Potencial = (Odd - 1) * Stake
  const lucro_potencial = (odd_casa - 1) * stake_aposta;
  const valor_esperado_reais = (prob_packball_decimal * lucro_potencial) - (prob_perder_decimal * stake_aposta);

  // 5. ROI Esperado (Yield) em %
  // Evitamos divisão por zero caso a stake seja 0 (usamos 1 como base teórica se stake for 0)
  const base_calculo_roi = stake_aposta > 0 ? stake_aposta : 1;
  const roi_esperado_percentual = (valor_esperado_reais / base_calculo_roi) * 100;

  // Status
  const status_ev = valor_esperado_reais > 0 ? "EV POSITIVO" : "EV NEGATIVO";

  return {
    odd_justa,
    valor_esperado_reais,
    roi_esperado_percentual,
    status_ev
  };
}

/**
 * FUNÇÃO CORE: calcularStakeKelly
 * 
 * Implementa o Critério de Kelly para Gestão de Banca.
 * O Kelly Criterion determina o tamanho ideal da aposta para maximizar o crescimento
 * geométrico da banca ao longo do tempo, evitando o risco de ruína.
 * 
 * @param banca_total - O valor total da Banca disponível.
 * @param odd_casa - A Odd oferecida pela Casa de Apostas.
 * @param roi_esperado_decimal - O Yield/EV calculado anteriormente (Ex: 0.10 para 10%).
 * @param fator_kelly - Fração de risco (1.0 = Full Kelly, 0.5 = Half Kelly).
 */
export function calcularStakeKelly(
  banca_total: number,
  odd_casa: number,
  roi_esperado_decimal: number,
  fator_kelly: number
) {
  // Se não há valor esperado positivo, o critério de Kelly dita stake ZERO.
  if (roi_esperado_decimal <= 0) {
    return {
      fracao_kelly_cheio: 0,
      fracao_kelly_aplicada: 0,
      stake_ideal_reais: 0,
      mensagem_risco: "EV Negativo ou Nulo. O critério de Kelly recomenda não apostar."
    };
  }

  // 1. CÁLCULO DO LUCRO LÍQUIDO DA ODD (b)
  // Em apostas decimais, o lucro é (Odd - 1).
  const odd_net = odd_casa - 1;

  // 2. CÁLCULO DA FRAÇÃO DE KELLY (f*)
  // Fórmula Clássica: f* = (bp - q) / b
  // Onde 'bp - q' é a nossa vantagem (EV/Yield).
  // Simplificando: Fração = ROI Esperado / (Odd - 1)
  const fracao_kelly_cheio = roi_esperado_decimal / odd_net;

  // 3. APLICAÇÃO DO FATOR DE SEGURANÇA (Fractional Kelly)
  // Punters profissionais raramente usam Full Kelly (fator 1.0) devido à volatilidade.
  // É comum usar 1/2 Kelly, 1/4 Kelly, etc.
  const fracao_kelly_aplicada = fracao_kelly_cheio * fator_kelly;

  // 4. CÁLCULO DA STAKE EM REAIS
  const stake_ideal_reais = fracao_kelly_aplicada * banca_total;

  // MENSAGEM DE RISCO
  // Se o Kelly sugerir apostar mais de 20% da banca em uma única bet,
  // provavelmente a probabilidade estimada está muito otimista ou há um erro.
  let mensagem_risco = "Stake dentro dos parâmetros normais de gestão.";
  if (fracao_kelly_cheio > 0.20) {
    mensagem_risco = "ALERTA DE ALTO RISCO: O cálculo sugere uma exposição superior a 20% da banca. Verifique se sua probabilidade não está superestimada.";
  }

  return {
    fracao_kelly_cheio,
    fracao_kelly_aplicada,
    stake_ideal_reais,
    mensagem_risco
  };
}

/**
 * FUNÇÃO CORE: analisarAgressividade (Oracle)
 * 
 * Automatiza a decisão do Fator Kelly baseada na magnitude do EV.
 * 
 * @param roi_esperado_percentual - O ROI Esperado em % (Ex: 32.00).
 */
export function analisarAgressividade(roi_esperado_percentual: number): AggressivenessResult {
  let nivel = "";
  let fator_sugerido = 0;
  let mensagem = "";

  if (roi_esperado_percentual >= 25.0) {
    nivel = "EV GIGANTESCO / ERRO DE MERCADO";
    fator_sugerido = 0.75;
    mensagem = "Risco Justificado, Utilize o 0.75X na Aba Staking Kelly.";
  } else if (roi_esperado_percentual >= 15.0) {
    nivel = "EV FORTE / ALTA VANTAGEM";
    fator_sugerido = 0.5;
    mensagem = "Vantagem clara. Utilize o 0.50X (Meio Kelly) na Aba Staking.";
  } else if (roi_esperado_percentual >= 5.0) {
    nivel = "EV MEDIANO / VANTAGEM PADRÃO";
    fator_sugerido = 0.25;
    mensagem = "Vantagem padrão. Utilize o 0.25X (1/4 Kelly) para reduzir variância.";
  } else if (roi_esperado_percentual >= 0.1) {
    nivel = "EV MÍNIMO / ULTRACONSERVADOR";
    fator_sugerido = 0.1;
    mensagem = "Margem pequena. Utilize 0.10X (Décimo de Kelly) por segurança.";
  } else {
    // ROI < 0.1 ou Negativo
    nivel = "EV NEGATIVO / NÃO APOSTAR";
    fator_sugerido = 0;
    mensagem = "Sem valor matemático suficiente. Não realize a entrada.";
  }

  return {
    level: nivel,
    suggestedFactor: fator_sugerido,
    actionMessage: mensagem
  };
}

/**
 * UTILITY: converterOddParaProbabilidade
 * 
 * Helper function to calculate implied probability from an Odd.
 * 
 * @param odd_casa - A Odd atual oferecida pela Casa de Apostas.
 */
export function converterOddParaProbabilidade(odd_casa: number) {
  if (!odd_casa || odd_casa <= 1) {
    return {
      probabilidade_implicita_percentual: 0,
      mensagem: "Insira uma Odd válida (maior que 1.00)."
    };
  }

  const probabilidade_implicita_percentual = (1 / odd_casa) * 100;
  // Format to 2 decimal places for display logic
  const probFormatted = probabilidade_implicita_percentual.toFixed(2);
  const mensagem = `A Casa espera que este evento aconteça ${probFormatted}% das vezes.`;

  return {
    probabilidade_implicita_percentual,
    mensagem
  };
}

/**
 * Wrapper for EV calculation
 * Converts string inputs to numbers automatically.
 * Now uses the core calcularEVPlus function.
 */
export const calculateBetEV = (inputs: BetInputs): BetResult => {
  // Cast inputs to Number. If empty string, result is 0.
  const prob = Number(inputs.probability);
  const odd = Number(inputs.houseOdd);
  const stake = Number(inputs.stake);
  
  const result = calcularEVPlus(prob, odd, stake);
  
  return {
    fairOdd: result.odd_justa,
    evDecimal: result.roi_esperado_percentual / 100, // ROI % / 100 = EV Decimal
    evMonetary: result.valor_esperado_reais,
    isPositive: result.valor_esperado_reais > 0,
    message: result.valor_esperado_reais > 0 
        ? "APOSTA COM VALOR VANTAGEM (Sinal Verde)" 
        : "APOSTA COM VALOR NEGATIVO, EVITAR (Sinal Vermelho)"
  };
};

/**
 * Wrapper for Kelly calculation
 * Converts string inputs to numbers automatically.
 */
export const calculateKellyStaking = (
  inputs: KellyInputs, 
  betInputs: BetInputs, 
  evDecimal: number
): KellyResult => {
  const bankroll = Number(inputs.bankroll);
  const odd = Number(betInputs.houseOdd); // Need to cast this as well since BetInputs now allows strings

  const result = calcularStakeKelly(
    bankroll,
    odd,
    evDecimal,
    inputs.kellyFactor
  );

  return {
    fullKellyFraction: result.fracao_kelly_cheio,
    appliedKellyFraction: result.fracao_kelly_aplicada,
    recommendedStake: result.stake_ideal_reais,
    riskMessage: result.mensagem_risco
  };
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const formatPercent = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(value);
};