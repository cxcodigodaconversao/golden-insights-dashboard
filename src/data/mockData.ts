export interface Atendimento {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  status: string;
  closer: string;
  gravacao: string;
  dataCall: Date;
  sdr: string;
  infoSdr: string;
  origem: string;
  valor?: number;
}

export interface CloserStats {
  nome: string;
  agendados: number;
  confirmados: number;
  compareceram: number;
  vendas: number;
  receita: number;
  percentualFechamento: number;
}

export interface SDRStats {
  nome: string;
  abordados: number;
  responderam: number;
  agendamentos: number;
  vendasGeradas: number;
}

export const statusColors: Record<string, { bg: string; text: string }> = {
  "Venda Recorrente": { bg: "bg-success/20", text: "text-success" },
  "Venda": { bg: "bg-success/20", text: "text-success" },
  "Pagamento agendado": { bg: "bg-warning/20", text: "text-warning" },
  "Em negociação": { bg: "bg-primary/20", text: "text-primary" },
  "Não compareceu": { bg: "bg-destructive/20", text: "text-destructive" },
  "Reembolsada": { bg: "bg-destructive/20", text: "text-destructive" },
  "Cancelado": { bg: "bg-destructive/20", text: "text-destructive" },
  "Sem interesse": { bg: "bg-muted", text: "text-muted-foreground" },
  "Sem dinheiro": { bg: "bg-muted", text: "text-muted-foreground" },
  "Não é prioridade": { bg: "bg-muted", text: "text-muted-foreground" },
  "Quer apenas no futuro": { bg: "bg-secondary", text: "text-secondary-foreground" },
  "Call Remarcada": { bg: "bg-secondary", text: "text-secondary-foreground" },
  "Sem qualificação": { bg: "bg-muted", text: "text-muted-foreground" },
};

export const origens = [
  "Social Selling",
  "Microondas",
  "Diagnóstico",
  "WhatsApp",
  "Webnário",
  "VSL",
];

export const closers = ["Vitor", "Gabriel", "Karine", "Rodrigo", "Jez"];
export const sdrs = ["Vitor", "Jez", "Ester", "Gabriel", "Karine", "Pedro", "Matheus"];

const parseValor = (status: string): number | undefined => {
  const match = status.match(/R\$\s*([\d.,]+)/);
  if (match) {
    return parseFloat(match[1].replace(".", "").replace(",", "."));
  }
  if (status.includes("Venda Recorrente")) return 2197;
  return undefined;
};

export const atendimentos: Atendimento[] = [
  { id: "1", nome: "Ozias Soares", telefone: "38 99726-5956", email: "oziassoares.junior@gmail.com", status: "Quer apenas no futuro", closer: "Vitor", gravacao: "", dataCall: new Date("2025-10-15"), sdr: "Jez", infoSdr: "", origem: "Social Selling" },
  { id: "2", nome: "Cristiana Freitas", telefone: "37 99821-2583", email: "freitascristiana2@gmail.com", status: "Não é prioridade", closer: "Vitor", gravacao: "", dataCall: new Date("2025-10-15"), sdr: "Vitor", infoSdr: "", origem: "Microondas" },
  { id: "3", nome: "Gabriel Ferreira", telefone: "98 98108-9843", email: "gabrielferreiragarcez66@gmail.com", status: "Venda Recorrente", closer: "Vitor", gravacao: "", dataCall: new Date("2025-10-16"), sdr: "Jez", infoSdr: "", origem: "Social Selling", valor: 2197 },
  { id: "4", nome: "Vinicius", telefone: "16 98235-6632", email: "vinicius.moromisato@gmail.com", status: "Venda R$ 3.997,00", closer: "Vitor", gravacao: "", dataCall: new Date("2025-10-16"), sdr: "Jez", infoSdr: "", origem: "Social Selling", valor: 3997 },
  { id: "5", nome: "Juliana De Paula", telefone: "11 96575-8117", email: "judepaula84@gmail.com", status: "Venda R$ 2.997,00", closer: "Vitor", gravacao: "", dataCall: new Date("2025-10-17"), sdr: "Jez", infoSdr: "", origem: "Social Selling", valor: 2997 },
  { id: "6", nome: "Pedro Valerio Dusi", telefone: "32 8469-2159", email: "pedrovtdusi@gmail.com", status: "Venda R$ 2.197", closer: "Vitor", gravacao: "", dataCall: new Date("2025-10-21"), sdr: "Jez", infoSdr: "", origem: "Social Selling", valor: 2197 },
  { id: "7", nome: "Gabriel Rosa", telefone: "12 98299 8800", email: "gabrielrosasantosrocha@gmail.com", status: "Venda Recorrente", closer: "Vitor", gravacao: "", dataCall: new Date("2025-10-23"), sdr: "Vitor", infoSdr: "", origem: "Diagnóstico", valor: 2197 },
  { id: "8", nome: "Lorenzo", telefone: "(11) 94164-7280", email: "lozanini2406@gmail.com", status: "Venda R$ 2.997,00", closer: "Rodrigo", gravacao: "", dataCall: new Date("2025-10-30"), sdr: "Ester", infoSdr: "", origem: "Microondas", valor: 2997 },
  { id: "9", nome: "Bruno Freitas", telefone: "49 99126-830", email: "brunoneto67@hotmail.com", status: "Venda R$ 2.197", closer: "Vitor", gravacao: "", dataCall: new Date("2025-10-31"), sdr: "Jez", infoSdr: "", origem: "Social Selling", valor: 2197 },
  { id: "10", nome: "Gideon Silva", telefone: "11 95681-3169", email: "gideonsurbano@gmail.com", status: "Venda Recorrente", closer: "Vitor", gravacao: "", dataCall: new Date("2025-10-31"), sdr: "Jez", infoSdr: "", origem: "Social Selling", valor: 2197 },
  { id: "11", nome: "Felipe Barbosa", telefone: "34 9931-2940", email: "felipe.fbs888@gmail.com", status: "Venda R$ 2.197", closer: "Vitor", gravacao: "", dataCall: new Date("2025-11-07"), sdr: "Vitor", infoSdr: "", origem: "Microondas", valor: 2197 },
  { id: "12", nome: "Felipe Marques", telefone: "32 8430-7722", email: "felipemarques@metodohod.com", status: "Venda R$ 3.997,00", closer: "Vitor", gravacao: "", dataCall: new Date("2025-11-14"), sdr: "Vitor", infoSdr: "", origem: "Microondas", valor: 3997 },
  { id: "13", nome: "Thalisson", telefone: "77 8163-2136", email: "pradothalisson@gmail.com", status: "Venda R$ 2.197", closer: "Vitor", gravacao: "", dataCall: new Date("2025-11-14"), sdr: "Vitor", infoSdr: "", origem: "Microondas", valor: 2197 },
  { id: "14", nome: "Alexandre", telefone: "91 98898-3020", email: "alexandre.v.melo@gmail.com", status: "Venda R$ 2.197", closer: "Rodrigo", gravacao: "", dataCall: new Date("2025-11-14"), sdr: "Jez", infoSdr: "", origem: "Webnário", valor: 2197 },
  { id: "15", nome: "Rodrigo", telefone: "71 9959-8019", email: "Wsp.rodrigo@gmail.com", status: "Venda R$ 2.997,00", closer: "Rodrigo", gravacao: "", dataCall: new Date("2025-11-21"), sdr: "Jez", infoSdr: "", origem: "Microondas", valor: 2997 },
  { id: "16", nome: "Segiane Cabral", telefone: "85 9264-2042", email: "segiane.cabral@gmail.com", status: "Venda R$ 2.197", closer: "Vitor", gravacao: "", dataCall: new Date("2025-11-20"), sdr: "Vitor", infoSdr: "", origem: "Webnário", valor: 2197 },
  { id: "17", nome: "Lucas", telefone: "31 9587-3740", email: "lh842261@gmail.com", status: "Venda R$ 2.197", closer: "Vitor", gravacao: "", dataCall: new Date("2025-11-21"), sdr: "Vitor", infoSdr: "", origem: "Microondas", valor: 2197 },
  { id: "18", nome: "Talita", telefone: "35 9843-4746", email: "", status: "Venda R$ 2.197", closer: "Vitor", gravacao: "", dataCall: new Date("2025-11-21"), sdr: "Vitor", infoSdr: "", origem: "Webnário", valor: 2197 },
  { id: "19", nome: "Walter", telefone: "(51) 99548-1587", email: "wfernandesneto@hotmail.com", status: "Venda R$ 2.997,00", closer: "Karine", gravacao: "", dataCall: new Date("2025-11-28"), sdr: "Karine", infoSdr: "", origem: "Microondas", valor: 2997 },
  { id: "20", nome: "Henrique", telefone: "", email: "henriquebzk33x@gmail.com", status: "Venda R$ 2.997,00", closer: "Vitor", gravacao: "", dataCall: new Date("2025-11-26"), sdr: "Vitor", infoSdr: "", origem: "Webnário", valor: 2997 },
  { id: "21", nome: "Priscila Putini", telefone: "11 97678-6132", email: "pri.c.putini@gmail.com", status: "Venda R$ 2.197", closer: "Vitor", gravacao: "", dataCall: new Date("2025-11-26"), sdr: "Vitor", infoSdr: "", origem: "Webnário", valor: 2197 },
  { id: "22", nome: "Raul", telefone: "", email: "raullenon2016@outlook.com", status: "Venda R$ 2.997,00", closer: "Vitor", gravacao: "", dataCall: new Date("2025-11-26"), sdr: "Vitor", infoSdr: "", origem: "Webnário", valor: 2997 },
  { id: "23", nome: "Cristiane Tiane", telefone: "11972520542", email: "cristiane_tiane22@hotmail.com", status: "Venda R$ 3.997,00", closer: "Gabriel", gravacao: "", dataCall: new Date("2025-11-26"), sdr: "Gabriel", infoSdr: "", origem: "Webnário", valor: 3997 },
  { id: "24", nome: "Cléo", telefone: "", email: "cleogrates.27@gmail.com", status: "Venda R$ 2.997,00", closer: "Vitor", gravacao: "", dataCall: new Date("2025-11-27"), sdr: "Vitor", infoSdr: "", origem: "Webnário", valor: 2997 },
  { id: "25", nome: "Daniella Faria", telefone: "35997501575", email: "daniellafaria219@gmail.com", status: "Venda R$ 3.997,00", closer: "Gabriel", gravacao: "", dataCall: new Date("2025-12-05"), sdr: "Gabriel", infoSdr: "", origem: "Microondas", valor: 3997 },
  { id: "26", nome: "Cibele", telefone: "41 99965-9843", email: "cibelemiranda.closer@gmail.com", status: "Venda Recorrente", closer: "Karine", gravacao: "", dataCall: new Date("2025-12-08"), sdr: "Karine", infoSdr: "", origem: "Microondas", valor: 2197 },
  { id: "27", nome: "Diogo", telefone: "67993419772", email: "figueiredo.new@icloud.com", status: "Venda Recorrente", closer: "Karine", gravacao: "", dataCall: new Date("2025-12-10"), sdr: "Karine", infoSdr: "", origem: "Microondas", valor: 2197 },
  { id: "28", nome: "Elisangela Lira", telefone: "11982097038", email: "emsouzas@gmail.com", status: "Venda Recorrente", closer: "Gabriel", gravacao: "", dataCall: new Date("2025-12-10"), sdr: "Gabriel", infoSdr: "", origem: "Microondas", valor: 2197 },
  { id: "29", nome: "André", telefone: "", email: "andre.amil@hotmail.com", status: "Venda R$ 2.997,00", closer: "Vitor", gravacao: "", dataCall: new Date("2025-12-03"), sdr: "Vitor", infoSdr: "", origem: "Webnário", valor: 2997 },
  { id: "30", nome: "Jhonny", telefone: "", email: "jmfibra@outlook.com", status: "Venda R$ 2.197", closer: "Vitor", gravacao: "", dataCall: new Date("2025-12-03"), sdr: "Vitor", infoSdr: "", origem: "Microondas", valor: 2197 },
  { id: "31", nome: "Renata Ortiz Kraulich", telefone: "67 9838-0282", email: "renataortizkraulich@gmail.com", status: "Venda R$ 3.997,00", closer: "Vitor", gravacao: "", dataCall: new Date("2025-12-12"), sdr: "Vitor", infoSdr: "", origem: "Webnário", valor: 3997 },
  { id: "32", nome: "Viviane Trevisan", telefone: "16997641616", email: "vivianesantostrevisan@gmail.com", status: "Venda R$ 2.197", closer: "Gabriel", gravacao: "", dataCall: new Date("2025-12-15"), sdr: "Gabriel", infoSdr: "", origem: "Social Selling", valor: 2197 },
  { id: "33", nome: "Diego Ravy", telefone: "71991252658", email: "diegoravy1@gmail.com", status: "Venda R$ 2.997,00", closer: "Gabriel", gravacao: "", dataCall: new Date("2025-12-15"), sdr: "Gabriel", infoSdr: "", origem: "Microondas", valor: 2997 },
  { id: "34", nome: "Cristina Gonçalves", telefone: "34996530302", email: "cristina181968@gmai.com", status: "Venda Recorrente", closer: "Gabriel", gravacao: "", dataCall: new Date("2025-12-19"), sdr: "Gabriel", infoSdr: "", origem: "VSL", valor: 2197 },
  { id: "35", nome: "Natalia Lima", telefone: "32991517739", email: "nataliacristinadelima@outlook.com", status: "Venda Recorrente", closer: "Gabriel", gravacao: "", dataCall: new Date("2025-12-17"), sdr: "Gabriel", infoSdr: "", origem: "Microondas", valor: 2197 },
  { id: "36", nome: "Paulo", telefone: "6 9904-3750", email: "Paulocesarpcoliveira@gmail.com", status: "Venda R$ 2.997,00", closer: "Vitor", gravacao: "", dataCall: new Date("2025-12-17"), sdr: "Vitor", infoSdr: "", origem: "Social Selling", valor: 2997 },
  { id: "37", nome: "Mila Pinheiro", telefone: "75992310614", email: "milapinheirosm@gmail.com", status: "Venda R$ 2.000", closer: "Gabriel", gravacao: "", dataCall: new Date("2025-12-18"), sdr: "Gabriel", infoSdr: "", origem: "Social Selling", valor: 2000 },
  { id: "38", nome: "Juliana Muramatsu", telefone: "+55 11 92003-5234", email: "mjuinhazinha@gmail.com", status: "Venda R$ 2.997,00", closer: "Jez", gravacao: "", dataCall: new Date("2025-12-22"), sdr: "Jez", infoSdr: "", origem: "VSL", valor: 2997 },
  { id: "39", nome: "Mateus Santos", telefone: "63 98150-1927", email: "mateus.ms22@gmail.com", status: "Venda Recorrente", closer: "Gabriel", gravacao: "", dataCall: new Date("2025-12-22"), sdr: "Gabriel", infoSdr: "", origem: "Microondas", valor: 2197 },
  { id: "40", nome: "Felipe iris", telefone: "55 8100-6913", email: "felipeiris3@gmail.com", status: "Venda Recorrente", closer: "Gabriel", gravacao: "", dataCall: new Date("2025-12-29"), sdr: "Gabriel", infoSdr: "", origem: "VSL", valor: 2197 },
  { id: "41", nome: "Kelvin Souza", telefone: "92985652589", email: "kelvinsouza758@gmail.com", status: "Venda Recorrente", closer: "Gabriel", gravacao: "", dataCall: new Date("2025-12-29"), sdr: "Jez", infoSdr: "", origem: "Social Selling", valor: 2197 },
  { id: "42", nome: "Angelica Faganello", telefone: "", email: "a.faganello4@gmail.com", status: "Venda Recorrente", closer: "Gabriel", gravacao: "", dataCall: new Date("2025-12-29"), sdr: "Gabriel", infoSdr: "", origem: "VSL", valor: 2197 },
  // Não vendas para ter mais dados
  { id: "43", nome: "Sara Evangelista", telefone: "27 99627-5929", email: "saraevieira@hotmail.com", status: "Não compareceu", closer: "Vitor", gravacao: "", dataCall: new Date("2025-10-16"), sdr: "Vitor", infoSdr: "", origem: "Microondas" },
  { id: "44", nome: "Hugo Bispo", telefone: "21 98224-9573", email: "hugo_bcalheiros@hotmail.com", status: "Não compareceu", closer: "Vitor", gravacao: "", dataCall: new Date("2025-10-17"), sdr: "Vitor", infoSdr: "", origem: "Microondas" },
  { id: "45", nome: "Alisson", telefone: "88 9748 0346", email: "falisouza35@gmail.com", status: "Reembolsada", closer: "Vitor", gravacao: "", dataCall: new Date("2025-10-18"), sdr: "Vitor", infoSdr: "Cancelada", origem: "WhatsApp" },
  { id: "46", nome: "Felipe Santos", telefone: "51 8107 1944", email: "felipesantos@lumnis.com.br", status: "Pagamento agendado", closer: "Vitor", gravacao: "", dataCall: new Date("2025-10-20"), sdr: "Jez", infoSdr: "", origem: "WhatsApp" },
  { id: "47", nome: "Gustavo Lazaro", telefone: "16 98239 7320", email: "gulazaro27@gmail.com", status: "Sem interesse", closer: "Vitor", gravacao: "", dataCall: new Date("2025-10-20"), sdr: "Jez", infoSdr: "", origem: "Diagnóstico" },
  { id: "48", nome: "Mayara", telefone: "41 9242 9885", email: "caziukmayara@gmail.com", status: "Não compareceu", closer: "Vitor", gravacao: "", dataCall: new Date("2025-10-22"), sdr: "Jez", infoSdr: "Não compareceu em 2 reuniões agendadas", origem: "Diagnóstico" },
  { id: "49", nome: "Amauri", telefone: "19 98983-1102", email: "amrbleinat@gmail.com", status: "Em negociação", closer: "Vitor", gravacao: "", dataCall: new Date("2025-10-23"), sdr: "Jez", infoSdr: "", origem: "Social Selling" },
  { id: "50", nome: "Rosineide", telefone: "27 99787-8602", email: "rosineiamoscar@hotmail.com", status: "Sem dinheiro", closer: "Vitor", gravacao: "", dataCall: new Date("2025-11-18"), sdr: "Vitor", infoSdr: "", origem: "Microondas" },
];

// Métricas calculadas
export const calcularMetricas = (data: Atendimento[], startDate: Date, endDate: Date) => {
  const filtered = data.filter(a => a.dataCall >= startDate && a.dataCall <= endDate);
  
  const vendas = filtered.filter(a => a.status.includes("Venda") && !a.status.includes("Reembolsada"));
  const receita = vendas.reduce((acc, v) => acc + (v.valor || 0), 0);
  const compareceram = filtered.filter(a => !a.status.includes("Não compareceu")).length;
  const naoCompareceram = filtered.filter(a => a.status.includes("Não compareceu")).length;
  
  return {
    totalAtendimentos: filtered.length,
    vendas: vendas.length,
    receita,
    compareceram,
    naoCompareceram,
    taxaComparecimento: filtered.length > 0 ? (compareceram / filtered.length) * 100 : 0,
    taxaConversao: compareceram > 0 ? (vendas.length / compareceram) * 100 : 0,
    ticketMedio: vendas.length > 0 ? receita / vendas.length : 0,
  };
};

export const calcularRankingClosers = (data: Atendimento[], startDate: Date, endDate: Date): CloserStats[] => {
  const filtered = data.filter(a => a.dataCall >= startDate && a.dataCall <= endDate);
  const closerMap: Record<string, CloserStats> = {};

  closers.forEach(closer => {
    const closerData = filtered.filter(a => a.closer === closer);
    const vendas = closerData.filter(a => a.status.includes("Venda") && !a.status.includes("Reembolsada"));
    const compareceram = closerData.filter(a => !a.status.includes("Não compareceu")).length;
    const receita = vendas.reduce((acc, v) => acc + (v.valor || 0), 0);

    closerMap[closer] = {
      nome: closer,
      agendados: closerData.length,
      confirmados: closerData.length,
      compareceram,
      vendas: vendas.length,
      receita,
      percentualFechamento: compareceram > 0 ? (vendas.length / compareceram) * 100 : 0,
    };
  });

  return Object.values(closerMap).sort((a, b) => b.receita - a.receita);
};
