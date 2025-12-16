import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Target, 
  BrainCircuit, 
  AlertCircle,
  Activity,
  Layers,
  PieChart,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

import { InputGroup } from './components/InputGroup';
import { ResultCard } from './components/ResultCard';
import { calculateBetEV, calculateKellyStaking, analisarAgressividade, converterOddParaProbabilidade, formatCurrency, formatPercent } from './utils/calculations';
import { analyzeBetWithGemini } from './services/geminiService';
import { BetInputs, BetResult, KellyInputs, KellyResult, AggressivenessResult } from './types';

const App: React.FC = () => {
  // --- Tabs State ---
  const [activeTab, setActiveTab] = useState<'ev' | 'kelly'>('ev');

  // --- Betting State ---
  // Initialized with empty strings as requested by user
  const [inputs, setInputs] = useState<BetInputs>({
    probability: '', 
    houseOdd: '',
    stake: ''
  });

  const [result, setResult] = useState<BetResult>({
    fairOdd: 0,
    evDecimal: 0,
    evMonetary: 0,
    isPositive: false,
    message: ""
  });

  // --- Kelly State ---
  const [kellyInputs, setKellyInputs] = useState<KellyInputs>({
    bankroll: '',
    kellyFactor: 0.25 // Default to Quarter Kelly (Safe)
  });

  const [kellyResult, setKellyResult] = useState<KellyResult>({
    fullKellyFraction: 0,
    appliedKellyFraction: 0,
    recommendedStake: 0,
    riskMessage: ""
  });

  // --- Oracle (Aggressiveness) State ---
  const [advisorResult, setAdvisorResult] = useState<AggressivenessResult>({
    level: "",
    suggestedFactor: 0,
    actionMessage: ""
  });

  // --- Quick Tool State ---
  const [quickOdd, setQuickOdd] = useState('');

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- Calculations ---
  useEffect(() => {
    // 1. Calculate EV
    const evCalc = calculateBetEV(inputs);
    setResult(evCalc);

    // 2. Calculate Aggressiveness (Oracle) based on ROI Percentage
    // evDecimal is 0.32, so we multiply by 100 to get 32.0
    const oracle = analisarAgressividade(evCalc.evDecimal * 100);
    setAdvisorResult(oracle);

    // 3. Calculate Kelly Stake based on EV result
    const kellyCalc = calculateKellyStaking(kellyInputs, inputs, evCalc.evDecimal);
    setKellyResult(kellyCalc);

    setAiAnalysis(null);
  }, [inputs, kellyInputs]);

  // Derived state for Quick Tool
  const quickProbResult = converterOddParaProbabilidade(Number(quickOdd));

  // --- Handlers ---
  const handleInputChange = (field: keyof BetInputs, value: string) => {
    // Allows empty string or partial number inputs without forcing parseFloat/0
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleKellyChange = (field: keyof KellyInputs, value: string) => {
    if (field === 'kellyFactor') {
      // Kelly Factor is a select dropdown, so we keep it as a number
      const numValue = parseFloat(value);
      setKellyInputs(prev => ({ ...prev, [field]: isNaN(numValue) ? 0 : numValue }));
    } else {
      // Bankroll is text input, allow string
      setKellyInputs(prev => ({ ...prev, [field]: value }));
    }
  };

  const applySuggestedFactor = () => {
    if (advisorResult.suggestedFactor > 0) {
      setKellyInputs(prev => ({ ...prev, kellyFactor: advisorResult.suggestedFactor }));
      setActiveTab('kelly'); // Automatically switch to Kelly tab to show result
    }
  };

  const handleAiAnalysis = async () => {
    if (!process.env.API_KEY) {
      alert("API Key não configurada.");
      return;
    }
    setIsAnalyzing(true);
    const analysis = await analyzeBetWithGemini(inputs, result);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  // --- Chart Data ---
  const chartData = [
    { name: 'Odd Justa', value: result.fairOdd, type: 'Fair' },
    // Convert houseOdd to number for chart
    { name: 'Odd Casa', value: Number(inputs.houseOdd) || 0, type: 'House' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 flex items-center space-x-3 border-b border-slate-800 pb-6">
          <div className="p-3 bg-[#39FF14] rounded-lg shadow-lg shadow-[#39FF14]/20">
            <Activity className="text-slate-950" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">EV System</h1>
            <p className="text-slate-400 text-sm">Análise Preditiva e Gerenciamento de Risco</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-8 bg-slate-900/50 p-1 rounded-xl w-fit border border-slate-800">
          <button
            onClick={() => setActiveTab('ev')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center ${
              activeTab === 'ev' 
                ? 'bg-[#39FF14] text-slate-950 shadow-lg shadow-[#39FF14]/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calculator size={18} className="mr-2" />
            Calculadora EV+
          </button>
          <button
            onClick={() => setActiveTab('kelly')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center ${
              activeTab === 'kelly' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers size={18} className="mr-2" />
            Staking Kelly
          </button>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN (Variable based on Tab) */}
          <div className="lg:col-span-4 space-y-6">
            
            {activeTab === 'ev' ? (
              /* --- TAB 1: EV Inputs --- */
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl animate-fade-in">
                <h2 className="text-xl font-semibold mb-6 flex items-center text-[#39FF14]">
                  <Calculator className="mr-2" size={20} />
                  Parâmetros da Aposta
                </h2>

                <div className="space-y-6">
                  <InputGroup
                    label="Probabilidade Real (%)"
                    value={inputs.probability}
                    onChange={(e) => handleInputChange('probability', e.target.value)}
                    step="0.1"
                    placeholder="Ex: 50"
                    suffix={<Percent size={16} />}
                  />

                  <InputGroup
                    label="Odd da Casa (Bookie)"
                    value={inputs.houseOdd}
                    onChange={(e) => handleInputChange('houseOdd', e.target.value)}
                    step="0.01"
                    placeholder="Ex: 2.05"
                    prefix={<span className="text-sm font-bold">@</span>}
                  />

                  <InputGroup
                    label="Stake (Valor da Aposta)"
                    value={inputs.stake}
                    onChange={(e) => handleInputChange('stake', e.target.value)}
                    step="1.00"
                    placeholder="Ex: 100.00"
                    prefix={<DollarSign size={16} />}
                  />
                </div>
              </div>
            ) : (
              /* --- TAB 2: Kelly Inputs --- */
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl animate-fade-in">
                <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-400">
                  <PieChart className="mr-2" size={20} />
                  Gestão de Banca
                </h2>
                
                <div className="space-y-6">
                   <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                      <p className="text-xs text-slate-400 mb-1">Cenário Atual (Vindo da Aba 1)</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-200">Odd: @{Number(inputs.houseOdd) || 0}</span>
                        <span className={`text-sm font-bold ${result.evDecimal > 0 ? 'text-[#39FF14]' : 'text-rose-400'}`}>
                           EV: {formatPercent(result.evDecimal)}
                        </span>
                      </div>
                   </div>

                   <InputGroup
                      label="Banca Total (Bankroll)"
                      value={kellyInputs.bankroll}
                      onChange={(e) => handleKellyChange('bankroll', e.target.value)}
                      step="10.00"
                      placeholder="Ex: 1000.00"
                      prefix={<DollarSign size={16} />}
                   />

                   <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Fator Kelly (Agressividade)</label>
                    <select 
                      value={kellyInputs.kellyFactor}
                      onChange={(e) => handleKellyChange('kellyFactor', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
                    >
                      <option value="0.1">0.1x (Ultraconservador)</option>
                      <option value="0.125">1/8 Kelly (Conservador)</option>
                      <option value="0.25">1/4 Kelly (Padrão)</option>
                      <option value="0.5">1/2 Kelly (Moderado)</option>
                      <option value="0.75">3/4 Kelly (Agressivo)</option>
                      <option value="1.0">Full Kelly (Insano)</option>
                    </select>
                   </div>
                </div>

                <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Critério de Kelly:</strong> Calcula a stake matematicamente perfeita para maximizar o crescimento da banca a longo prazo, baseado na sua vantagem (EV).
                  </p>
                </div>
              </div>
            )}

            {/* AI Assistant (Always Visible) */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 rounded-2xl p-6 border border-indigo-500/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold flex items-center text-indigo-300">
                  <BrainCircuit className="mr-2" size={20} />
                  Analista IA
                </h3>
                {!aiAnalysis && (
                  <button 
                    onClick={handleAiAnalysis}
                    disabled={isAnalyzing}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-sm font-medium rounded-lg transition-colors flex items-center"
                  >
                    {isAnalyzing ? "Analisando..." : "Consultar Oracle"}
                  </button>
                )}
              </div>
              {aiAnalysis ? (
                <div className="text-sm text-indigo-100 leading-relaxed animate-fade-in bg-indigo-950/30 p-4 rounded-lg border border-indigo-500/30">
                  <div className="whitespace-pre-line">{aiAnalysis}</div>
                  <button onClick={() => handleAiAnalysis()} className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 underline">Atualizar Análise</button>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Solicite uma análise qualitativa para validar os números.</p>
              )}
            </div>

            {/* Quick Tool: Odd Converter */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center">
                  <RefreshCw size={16} className="mr-2 text-[#39FF14]" /> 
                  Conversor Rápido
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <InputGroup
                    label="Odd"
                    value={quickOdd}
                    onChange={(e) => setQuickOdd(e.target.value)}
                    placeholder="2.00"
                    step="0.01"
                  />
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block mb-1">Probabilidade Implícita</span>
                  <div className="text-3xl font-bold text-[#39FF14] tracking-tight">
                    {quickProbResult.probabilidade_implicita_percentual > 0 
                      ? formatPercent(quickProbResult.probabilidade_implicita_percentual / 100)
                      : "0%"}
                  </div>
                </div>
              </div>
              {quickProbResult.probabilidade_implicita_percentual > 0 && (
                <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-400">
                    {quickProbResult.mensagem}
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN (Results) */}
          <div className="lg:col-span-8 space-y-6">
            
            {activeTab === 'ev' ? (
              /* --- TAB 1 RESULTS --- */
              <>
                <div className={`rounded-2xl p-6 border-l-8 shadow-2xl flex items-center justify-between transition-colors duration-500 ${
                  result.isPositive ? 'bg-gradient-to-r from-[#39FF14]/10 to-slate-900 border-[#39FF14]' : 'bg-gradient-to-r from-rose-900/50 to-slate-900 border-rose-500'
                }`}>
                  <div>
                    <h2 className={`text-3xl font-bold mb-1 ${result.isPositive ? 'text-[#39FF14]' : 'text-rose-400'}`}>
                      {result.isPositive ? "EV+ ENCONTRADO" : "EV- NEGATIVO"}
                    </h2>
                    <p className="text-slate-300 font-medium opacity-80">{result.message}</p>
                  </div>
                  <div className={`p-4 rounded-full ${result.isPositive ? 'bg-[#39FF14] text-slate-950' : 'bg-rose-500/20 text-rose-400'}`}>
                    {result.isPositive ? <TrendingUp size={40} /> : <TrendingDown size={40} />}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ResultCard label="Odd Justa (Fair Line)" value={result.fairOdd.toFixed(2)} subValue={`Prob: ${(Number(inputs.probability) || 0).toFixed(2)}%`} icon={Target} />
                  <ResultCard label="ROI Esperado (Yield)" value={formatPercent(result.evDecimal)} subValue="Sobre a Stake" icon={Percent} variant={result.evDecimal > 0 ? 'positive' : 'negative'} />
                  <ResultCard label="EV Monetário" value={formatCurrency(result.evMonetary)} subValue={`Stake: ${formatCurrency(Number(inputs.stake) || 0)}`} icon={DollarSign} variant={result.evMonetary > 0 ? 'positive' : 'negative'} />
                </div>

                {/* --- ORACLE RECOMMENDATION CARD --- */}
                {result.isPositive && (
                  <div className="bg-slate-900 rounded-2xl p-6 border border-amber-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Lightbulb size={120} className="text-amber-500" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-sm font-medium text-amber-400 mb-2 uppercase tracking-wider flex items-center">
                        <Lightbulb size={18} className="mr-2" />
                        Conselheiro de Staking (Oracle)
                      </h3>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <p className="text-xl font-bold text-white">{advisorResult.level}</p>
                          <p className="text-slate-400 text-sm mt-1">{advisorResult.actionMessage}</p>
                        </div>
                        {advisorResult.suggestedFactor > 0 && (
                          <button 
                            onClick={applySuggestedFactor}
                            className="whitespace-nowrap px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center shadow-lg shadow-amber-900/20"
                          >
                            Aplicar Fator {advisorResult.suggestedFactor}x
                            <Layers size={16} className="ml-2" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* ... Chart code (same as before) ... */}
                   <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                      <h3 className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-wider">Comparativo de Odds</h3>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                            <ReferenceLine y={0} stroke="#475569" />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.type === 'Fair' ? '#64748b' : (result.isPositive ? '#39FF14' : '#f43f5e')} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                   </div>
                   {/* ... Insight Box ... */}
                   <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-center text-center">
                     <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Insight Rápido</h3>
                     <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        {result.isPositive ? (
                          <>
                           <div className="p-4 bg-[#39FF14]/20 rounded-full text-[#39FF14] mb-2"><TrendingUp size={32} /></div>
                           <p className="text-lg text-[#39FF14] font-medium">O mercado paga acima da probabilidade real.</p>
                           <p className="text-sm text-slate-400">Odd Casa <span className="text-white font-bold">{Number(inputs.houseOdd) || 0}</span> vs Fair Line <span className="text-white font-bold">{result.fairOdd.toFixed(2)}</span>.</p>
                          </>
                        ) : (
                          <>
                           <div className="p-4 bg-rose-500/10 rounded-full text-rose-400 mb-2"><AlertCircle size={32} /></div>
                           <p className="text-lg text-rose-300 font-medium">O mercado está subprecificando o evento.</p>
                           <p className="text-sm text-slate-400">EV Negativo. Vá para a aba Kelly para ver a sugestão de aposta (Zero).</p>
                          </>
                        )}
                     </div>
                   </div>
                </div>
              </>
            ) : (
              /* --- TAB 2 RESULTS (KELLY) --- */
              <>
                 <div className={`rounded-2xl p-6 border-l-8 shadow-2xl flex items-center justify-between transition-colors duration-500 ${
                  result.isPositive ? 'bg-gradient-to-r from-blue-900/50 to-slate-900 border-blue-500' : 'bg-gradient-to-r from-gray-900/50 to-slate-900 border-gray-600'
                }`}>
                  <div>
                    <h2 className={`text-3xl font-bold mb-1 ${result.isPositive ? 'text-blue-400' : 'text-gray-400'}`}>
                      {result.isPositive ? "STAKE SUGERIDA" : "SEM ENTRADA"}
                    </h2>
                    <p className="text-slate-300 font-medium opacity-80">
                      {result.isPositive ? "Baseada na sua vantagem e fator de risco." : "Não aposte em EV negativo."}
                    </p>
                  </div>
                  <div className={`p-4 rounded-full ${result.isPositive ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    <Layers size={40} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <ResultCard 
                      label="Stake Recomendada (R$)" 
                      value={formatCurrency(kellyResult.recommendedStake)}
                      subValue={`${formatPercent(kellyResult.appliedKellyFraction)} da Banca Total`}
                      icon={DollarSign}
                      variant={kellyResult.recommendedStake > 0 ? 'positive' : 'neutral'}
                    />
                  </div>
                  <ResultCard 
                    label="Fração Full Kelly (Teórico)" 
                    value={formatPercent(kellyResult.fullKellyFraction)}
                    subValue="Agressividade Máxima (1.0)"
                    icon={PieChart}
                  />
                  <ResultCard 
                    label="Fator Aplicado" 
                    value={`${kellyInputs.kellyFactor}x`}
                    subValue={`Redutor de Variância`}
                    icon={Activity}
                  />
                </div>

                {/* Risk Bar */}
                {result.isPositive && (
                  <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                    <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Análise de Risco da Stake</h3>
                    
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-200 bg-blue-900/50">
                            Exposição da Banca
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-blue-200">
                            {formatPercent(kellyResult.appliedKellyFraction)}
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-700">
                        <div style={{ width: `${Math.min(kellyResult.appliedKellyFraction * 100, 100)}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${kellyResult.appliedKellyFraction > 0.05 ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                      </div>
                      
                      <div className={`mt-4 p-4 rounded-lg border ${kellyResult.fullKellyFraction > 0.20 ? 'bg-rose-900/20 border-rose-500/30 text-rose-300' : 'bg-blue-900/20 border-blue-500/30 text-blue-300'}`}>
                        <div className="flex items-start">
                          <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{kellyResult.riskMessage}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;