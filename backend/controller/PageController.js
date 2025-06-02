import dotenv from 'dotenv';
dotenv.config();
const fe_url = 'https://fe-alung-ta-dot-b-01-450713.uc.r.appspot.com/src/views';

const index = (req, res) => {
  res.redirect(`${fe_url}/news.html`);
};

const detail = (req, res) => {
  res.redirect(`${fe_url}/news-detail.html?id=${req.params.id}`);
};

const dashboard = (req, res) => {
  res.redirect(`${fe_url}/admin/dashboard.html`);
}

const login = (req, res) => {
  res.redirect(`${fe_url}/login.html`);
}

export { index, detail, dashboard, login };