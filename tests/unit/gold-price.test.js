describe('gold price chart duration controls', () => {
  it('renders 7, 30, 90 and 365 records when the header controls are clicked', async () => {
    document.body.innerHTML = `
      <div class="card-header">
        <div id="chart-duration-controls">
          <button class="active" data-period="7">7 days</button>
          <button data-period="30">30 days</button>
          <button data-period="90">90 days</button>
          <button data-period="365">1 year</button>
        </div>
      </div>
      <div id="chart-loading"></div>
      <div id="chart-content" style="display:none">
        <select id="chart-gold-type"></select>
        <select id="chart-rate-type"><option value="sell">Sell</option></select>
        <canvas id="goldChart"></canvas>
      </div>
    `;

    const history = Array.from({ length: 365 }, (_, index) => ({
      date: new Date(2025, 0, index + 1).toISOString(),
      rates: {
        sjc_1l_10l: { label: 'SJC', buy: 100 + index, sell: 110 + index }
      }
    }));

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(history)
    });
    global.Chart = jest.fn().mockImplementation(() => ({ destroy: jest.fn() }));
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({});

    jest.isolateModules(() => {
      require('../../assets/js/gold-price.js');
    });
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    const renderedPointCount = () => {
      const config = global.Chart.mock.calls.at(-1)[1];
      return config.data.datasets[0].data.length;
    };

    expect(renderedPointCount()).toBe(7);

    for (const period of [30, 90, 365]) {
      document.querySelector(`[data-period="${period}"]`).click();
      expect(renderedPointCount()).toBe(period);
    }
  });
});
