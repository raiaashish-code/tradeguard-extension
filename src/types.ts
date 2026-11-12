export interface PreTradeRule {
  id: string;
  text: string;
}

export type BrokerTerminalType = 'tradingview' | 'kite' | 'dhan';

export interface InterceptedOrderContext {
  side: 'BUY' | 'SELL' | 'ORDER';
  symbol: string;
  price: number;
  quantity: number;
  orderType: 'MARKET' | 'LIMIT' | 'STOP';
  stopLossPrice?: number;
  timestamp: number;
  broker: BrokerTerminalType;
}

export interface InterceptionLogEvent {
  id: string;
  timestamp: string;
  stage: 'DOM_CLICK' | 'CAPTURE_INTERCEPT' | 'DOM_FREEZE' | 'CONTEXT_SCRAPED' | 'MODAL_MOUNT' | 'KEYBOARD_CHECK' | 'PASS_THROUGH_REPLAY' | 'ORDER_EXECUTED' | 'ORDER_ABORTED';
  message: string;
  details?: Record<string, any>;
  level: 'info' | 'success' | 'warn' | 'error';
}

export interface TradeJournalEntry {
  id: string;
  timestamp: number;
  timeString: string;
  symbol: string;
  side: 'BUY' | 'SELL' | 'ORDER';
  price: number;
  quantity: number;
  stopLoss?: number;
  riskAmount?: number;
  riskPercent?: number;
  strategyTag?: string;
  mindsetTag?: string;
  broker: string;
}

export interface DisciplineSettings {
  accountCapital: number;
  maxRiskPercent: number;
  cooldownMinutes: number;
  maxTradesPerDay: number;
}
