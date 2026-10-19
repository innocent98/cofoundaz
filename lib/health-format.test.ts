import { describe, expect, it } from 'vitest';
import { dimensionLabel, formatLift, formatContribution, formatSignalTarget, formatSignalValue, sourceLabel } from './health-format';

describe('health signal formatting', () => {
  it('formats each unit', () => {
    expect(formatSignalValue({ value: 43, unit: 'score' })).toBe('43');
    expect(formatSignalValue({ value: 40, unit: '%' })).toBe('40%');
    expect(formatSignalValue({ value: 0, unit: 'count' })).toBe('0');
    expect(formatSignalValue({ value: 7, unit: 'months' })).toBe('7 months');
    expect(formatSignalValue({ value: 1, unit: 'days' })).toBe('1 day');
    expect(formatSignalValue({ value: 25, unit: 'events' })).toBe('25 events');
    expect(formatSignalTarget({ target: 12, unit: 'months' })).toBe('12 months');
  });

  it('never shows 999 months for a profitable startup', () => {
    expect(formatSignalValue({ value: 999, unit: 'months', status: 'not_burning' })).toBe('Profitable');
  });

  it('rounds to one decimal and signs contributions', () => {
    expect(formatContribution(8.6)).toBe('+8.6 pts');
    expect(formatContribution(0)).toBe('0 pts');
    expect(formatContribution(-2)).toBe('-2 pts');
    expect(formatSignalValue({ value: 8.04, unit: 'score' })).toBe('8');
  });

  it('labels the source link', () => {
    expect(sourceLabel('/documents/signatures')).toBe('E-signatures');
    expect(sourceLabel('/something/new-hub')).toBe('New hub');
  });
});

describe('recommendation copy', () => {
  it('pluralises the lift estimate', () => {
    expect(formatLift(1)).toBe('est. +1 pt');
    expect(formatLift(10)).toBe('est. +10 pts');
    expect(formatLift(0.5)).toBe('est. +0.5 pts');
    expect(formatContribution(1)).toBe('+1 pt');
  });

  it('maps the money key to Financial', () => {
    expect(dimensionLabel('money')).toBe('Financial');
    expect(dimensionLabel('Legal')).toBe('Legal');
  });
});
