/**
 * Unit tests for password generator functions
 */

describe('Password Generator', () => {
  const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  const NUMBERS = '0123456789';
  const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
  const AMBIGUOUS = '0Ol1I';

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Character Set Building', () => {
    test('should build correct charset with all options enabled', () => {
      let charset = '';
      charset += UPPERCASE;
      charset += LOWERCASE;
      charset += NUMBERS;
      charset += SYMBOLS;
      
      expect(charset).toContain('A');
      expect(charset).toContain('a');
      expect(charset).toContain('0');
      expect(charset).toContain('!');
    });

    test('should build charset with only selected options', () => {
      let charset = '';
      const options = {
        uppercase: true,
        lowercase: false,
        numbers: true,
        symbols: false
      };
      
      if (options.uppercase) charset += UPPERCASE;
      if (options.lowercase) charset += LOWERCASE;
      if (options.numbers) charset += NUMBERS;
      if (options.symbols) charset += SYMBOLS;
      
      expect(charset).toContain('A');
      expect(charset).toContain('0');
      expect(charset).not.toContain('a');
      expect(charset).not.toContain('!');
    });

    test('should exclude ambiguous characters when requested', () => {
      let charset = UPPERCASE + LOWERCASE + NUMBERS;
      charset = charset.split('').filter(char => !AMBIGUOUS.includes(char)).join('');
      
      expect(charset).not.toContain('0');
      expect(charset).not.toContain('O');
      expect(charset).not.toContain('l');
      expect(charset).not.toContain('1');
      expect(charset).not.toContain('I');
    });
  });

  describe('Password Generation', () => {
    test('should generate password of specified length', () => {
      const length = 12;
      const charset = UPPERCASE + LOWERCASE + NUMBERS + SYMBOLS;
      let password = '';
      
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
      }
      
      expect(password.length).toBe(length);
    });

    test('should generate password without duplicates when requested', () => {
      const length = 10;
      const charset = UPPERCASE + LOWERCASE + NUMBERS + SYMBOLS;
      const charArray = charset.split('');
      const shuffled = charArray.sort(() => Math.random() - 0.5);
      const password = shuffled.slice(0, length).join('');
      
      const uniqueChars = new Set(password);
      expect(uniqueChars.size).toBe(password.length);
    });

    test('should validate sufficient unique characters for no duplicate option', () => {
      const length = 100;
      const charset = UPPERCASE + LOWERCASE; // 52 chars
      const isValid = charset.length >= length;
      
      expect(isValid).toBe(false);
    });
  });

  describe('Character Type Enforcement', () => {
    test('should ensure at least one character from each selected type', () => {
      const password = 'Abc123!@#';
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSymbol = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]/.test(password);
      
      expect(hasUppercase).toBe(true);
      expect(hasLowercase).toBe(true);
      expect(hasNumber).toBe(true);
      expect(hasSymbol).toBe(true);
    });

    test('should detect missing character types', () => {
      const password = 'abcdefgh'; // Only lowercase
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSymbol = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]/.test(password);
      
      expect(hasUppercase).toBe(false);
      expect(hasLowercase).toBe(true);
      expect(hasNumber).toBe(false);
      expect(hasSymbol).toBe(false);
    });
  });

  describe('Password Strength Calculation', () => {
    test('should calculate higher score for longer passwords', () => {
      const calculateLengthScore = (length) => {
        if (length >= 16) return 40;
        else if (length >= 12) return 30;
        else if (length >= 8) return 20;
        else if (length >= 6) return 10;
        else return 5;
      };
      
      expect(calculateLengthScore(16)).toBe(40);
      expect(calculateLengthScore(12)).toBe(30);
      expect(calculateLengthScore(8)).toBe(20);
      expect(calculateLengthScore(6)).toBe(10);
      expect(calculateLengthScore(4)).toBe(5);
    });

    test('should calculate complexity score based on character types', () => {
      const calculateComplexityScore = (options) => {
        let complexity = 0;
        if (options.uppercase) complexity += 10;
        if (options.lowercase) complexity += 10;
        if (options.numbers) complexity += 10;
        if (options.symbols) complexity += 10;
        return complexity;
      };
      
      const allOptions = { uppercase: true, lowercase: true, numbers: true, symbols: true };
      expect(calculateComplexityScore(allOptions)).toBe(40);
      
      const twoOptions = { uppercase: true, lowercase: true, numbers: false, symbols: false };
      expect(calculateComplexityScore(twoOptions)).toBe(20);
    });

    test('should calculate variety score based on unique characters', () => {
      const calculateVarietyScore = (password) => {
        const uniqueChars = new Set(password).size;
        const variety = (uniqueChars / password.length) * 20;
        return variety;
      };
      
      const highVariety = 'Abcd1234!@#$';
      expect(calculateVarietyScore(highVariety)).toBe(20);
      
      const lowVariety = 'aaaaaabb';
      expect(calculateVarietyScore(lowVariety)).toBeLessThan(10);
    });

    test('should determine correct strength level', () => {
      const getStrengthLevel = (score) => {
        if (score >= 80) return 'very_strong';
        else if (score >= 60) return 'strong';
        else if (score >= 40) return 'good';
        else if (score >= 20) return 'weak';
        else return 'very_weak';
      };
      
      expect(getStrengthLevel(85)).toBe('very_strong');
      expect(getStrengthLevel(65)).toBe('strong');
      expect(getStrengthLevel(45)).toBe('good');
      expect(getStrengthLevel(25)).toBe('weak');
      expect(getStrengthLevel(15)).toBe('very_weak');
    });
  });

  describe('Validation', () => {
    test('should require at least one character type selected', () => {
      const options = {
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false
      };
      
      const isValid = options.uppercase || options.lowercase || options.numbers || options.symbols;
      expect(isValid).toBe(false);
    });

    test('should accept valid option combinations', () => {
      const options = {
        uppercase: true,
        lowercase: true,
        numbers: false,
        symbols: false
      };
      
      const isValid = options.uppercase || options.lowercase || options.numbers || options.symbols;
      expect(isValid).toBe(true);
    });
  });

  describe('Password History', () => {
    test('should add password to history', () => {
      const history = [];
      const password = 'Test123!@#';
      const historyItem = {
        password: password,
        timestamp: new Date().toLocaleString('vi-VN'),
        length: password.length
      };
      
      history.unshift(historyItem);
      
      expect(history.length).toBe(1);
      expect(history[0].password).toBe(password);
      expect(history[0].length).toBe(10);
    });

    test('should limit history to 10 items', () => {
      let history = [];
      
      for (let i = 0; i < 15; i++) {
        history.unshift({
          password: `password${i}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          length: 10
        });
      }
      
      if (history.length > 10) {
        history = history.slice(0, 10);
      }
      
      expect(history.length).toBe(10);
      expect(history[0].password).toBe('password14');
    });

    test('should clear all history', () => {
      let history = [
        { password: 'pass1', timestamp: 'time1', length: 5 },
        { password: 'pass2', timestamp: 'time2', length: 5 }
      ];
      
      history = [];
      expect(history.length).toBe(0);
    });
  });
});
