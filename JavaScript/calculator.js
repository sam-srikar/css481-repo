const calculatorState = {
  currentValue: '0',
  expression: '',
  justEvaluated: false,
};

function formatDisplay(value) {
  if (!Number.isFinite(value)) {
    return 'Error';
  }

  const rounded = Number(value.toFixed(10));
  return String(rounded);
}

function updateDisplay() {
  const display = document.getElementById('calculatorDisplay');
  if (!display) {
    return;
  }

  display.value = calculatorState.currentValue;
}

function precedence(operator) {
  if (operator === '+' || operator === '-') {
    return 1;
  }

  if (operator === '*' || operator === '/') {
    return 2;
  }

  return 0;
}

function applyOperator(values, operators) {
  const operator = operators.pop();
  const rightValue = values.pop();
  const leftValue = values.pop();

  if (operator === '+') {
    values.push(leftValue + rightValue);
  } else if (operator === '-') {
    values.push(leftValue - rightValue);
  } else if (operator === '*') {
    values.push(leftValue * rightValue);
  } else if (operator === '/') {
    if (rightValue === 0) {
      values.push(Number.NaN);
      return;
    }
    values.push(leftValue / rightValue);
  }
}

function evaluateExpression(expression) {
  const tokens = [];
  let currentNumber = '';

  for (const character of expression) {
    if (/[0-9.]/.test(character)) {
      currentNumber += character;
    } else if (['+', '-', '*', '/'].includes(character)) {
      if (currentNumber) {
        tokens.push(currentNumber);
        currentNumber = '';
      }
      tokens.push(character);
    }
  }

  if (currentNumber) {
    tokens.push(currentNumber);
  }

  const values = [];
  const operators = [];

  for (const token of tokens) {
    if (!['+', '-', '*', '/'].includes(token)) {
      values.push(Number(token));
      continue;
    }

    while (
      operators.length > 0 &&
      precedence(operators[operators.length - 1]) >= precedence(token)
    ) {
      applyOperator(values, operators);
    }

    operators.push(token);
  }

  while (operators.length > 0) {
    applyOperator(values, operators);
  }

  if (values.length !== 1 || Number.isNaN(values[0])) {
    return Number.NaN;
  }

  return values[0];
}

function handleNumberInput(value) {
  if (calculatorState.justEvaluated) {
    calculatorState.expression = '';
    calculatorState.currentValue = '0';
    calculatorState.justEvaluated = false;
  }

  const isAfterOperator = /[+\-*/]$/.test(calculatorState.expression);

  if (calculatorState.expression === '' || isAfterOperator) {
    calculatorState.currentValue = String(value);
  } else if (calculatorState.currentValue === '0') {
    calculatorState.currentValue = String(value);
  } else {
    calculatorState.currentValue += String(value);
  }

  if (calculatorState.expression === '' || isAfterOperator) {
    calculatorState.expression += String(value);
  } else {
    calculatorState.expression += String(value);
  }

  updateDisplay();
}

function handleOperatorInput(nextOperator) {
  if (calculatorState.expression === '') {
    return;
  }

  if (/[+\-*/]$/.test(calculatorState.expression)) {
    calculatorState.expression = calculatorState.expression.slice(0, -1) + nextOperator;
    calculatorState.justEvaluated = false;
    updateDisplay();
    return;
  }

  const result = evaluateExpression(calculatorState.expression);
  calculatorState.expression = formatDisplay(result) + nextOperator;
  calculatorState.currentValue = formatDisplay(result);
  calculatorState.justEvaluated = false;
  updateDisplay();
}

function handleEquals() {
  if (!calculatorState.expression || /[+\-*/]$/.test(calculatorState.expression)) {
    return;
  }

  const result = evaluateExpression(calculatorState.expression);
  calculatorState.currentValue = formatDisplay(result);
  calculatorState.expression = formatDisplay(result);
  calculatorState.justEvaluated = true;
  updateDisplay();
}

function handleClear() {
  calculatorState.currentValue = '0';
  calculatorState.expression = '';
  calculatorState.justEvaluated = false;
  updateDisplay();
}

function attachCalculatorHandlers() {
  const numberButtons = document.querySelectorAll('.key[data-value]');
  const operatorButtons = document.querySelectorAll('.key[data-action]');

  numberButtons.forEach((button) => {
    button.addEventListener('click', () => {
      handleNumberInput(Number(button.dataset.value));
    });
  });

  operatorButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;

      if (action === 'clear') {
        handleClear();
        return;
      }

      if (action === 'equals') {
        handleEquals();
        return;
      }

      const operatorMap = {
        add: '+',
        subtract: '-',
        multiply: '*',
        divide: '/',
      };

      handleOperatorInput(operatorMap[action]);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (/^[0-9]$/.test(event.key)) {
      handleNumberInput(Number(event.key));
      return;
    }

    if (event.key === '+') {
      handleOperatorInput('+');
      return;
    }

    if (event.key === '-') {
      handleOperatorInput('-');
      return;
    }

    if (event.key === '*') {
      handleOperatorInput('*');
      return;
    }

    if (event.key === '/') {
      handleOperatorInput('/');
      return;
    }

    if (event.key === '=' || event.key === 'Enter') {
      handleEquals();
      return;
    }

    if (event.key === 'Escape' || event.key === 'Backspace') {
      handleClear();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateDisplay();
  attachCalculatorHandlers();
});
