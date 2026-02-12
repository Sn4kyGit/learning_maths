export type MoneyType = 'bill' | 'coin';

export interface MoneyDenomination {
    id: string;
    value: number;
    label: string;
    type: MoneyType;
    imageUrl: string;
}

export interface PlacedMoney {
    id: string;
    denom: MoneyDenomination;
    x: number;
    y: number;
}
