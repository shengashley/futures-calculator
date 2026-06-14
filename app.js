const products = {
  TX: { pointValue: 200, initialMargin: 578000, maintenanceMargin: 443000, feeOneWay: 80 },
  MTX: { pointValue: 50, initialMargin: 144500, maintenanceMargin: 110750, feeOneWay: 30 },
  TMF: { pointValue: 10, initialMargin: 28900, maintenanceMargin: 22150, feeOneWay: 10 },
};

const TAX_RATE = 0.00002;
let currentProduct = "TMF";
let direction = "long";

const $ = (id) => document.getElementById(id);

function number(id) {
  const n = Number($(id).value);
  return Number.isFinite(n) ? n : 0;
}

function money(n) {
  return `${Math.round(n).toLocaleString("zh-TW")} 元`;
}

function plain(n, digits = 2) {
  return n.toLocaleString("zh-TW", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0
  });
}

function signedMoney(n) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${money(n)}`;
}

function setColor(el, value) {
  el.classList.remove("positive", "negative");
  if (value > 0) el.classList.add("positive");
  if (value < 0) el.classList.add("negative");
}

function calculate() {
  const p = products[currentProduct];

  const entry = number("entryPrice");
  const exit = number("exitPrice");
  const contracts = Math.max(0, Math.floor(number("contracts")));
  const feeOneWay = number("feeOneWay");
  const accountPrincipal = number("accountPrincipal");
  const initialMargin = number("initialMargin");
  const maintenanceMargin = number("maintenanceMargin");
  const includeTax = $("includeTax").checked;

  const diff = direction === "long" ? exit - entry : entry - exit;
  const grossPnl = diff * p.pointValue * contracts;
  const totalFee = feeOneWay * 2 * contracts;
  const tax = includeTax
    ? (entry * p.pointValue * TAX_RATE * contracts) + (exit * p.pointValue * TAX_RATE * contracts)
    : 0;

  const netPnl = grossPnl - totalFee - tax;
  const totalMargin = initialMargin * contracts;
  const roi = totalMargin > 0 ? (netPnl / totalMargin) * 100 : 0;
  const endingAccountPrincipal = accountPrincipal + netPnl;

  const marginGapPoints = (initialMargin - maintenanceMargin) / p.pointValue;
  const marginCallPrice = direction === "long" ? entry - marginGapPoints : entry + marginGapPoints;
  const distance = direction === "long" ? exit - marginCallPrice : marginCallPrice - exit;

  $("grossPnl").textContent = signedMoney(grossPnl);
  $("totalFee").textContent = `-${money(totalFee)}`;
  $("tax").textContent = `-${money(tax)}`;
  $("netPnl").textContent = signedMoney(netPnl);
  $("roi").textContent = `${roi > 0 ? "+" : ""}${plain(roi, 2)}%`;
  $("totalMargin").textContent = money(totalMargin);
  $("accountPrincipalResult").textContent = money(accountPrincipal);
  $("endingAccountPrincipal").textContent = money(endingAccountPrincipal);
  $("marginCallPrice").textContent = plain(marginCallPrice, 2);
  $("distanceToMarginCall").textContent = `${plain(distance, 2)} 點`;

  setColor($("grossPnl"), grossPnl);
  setColor($("netPnl"), netPnl);
  setColor($("roi"), roi);
  setColor($("endingAccountPrincipal"), endingAccountPrincipal - accountPrincipal);
}

function updatePointTools() {
  const point10 = number("point10Input");
  const point100 = number("point100Input");
  $("point10Result").textContent = `= ${money(point10 * 10)}`;
  $("point100Result").textContent = `= ${money(point100 * 100)}`;
}


function clearToZero() {
  [
    "entryPrice",
    "exitPrice",
    "contracts",
    "feeOneWay",
    "accountPrincipal",
    "initialMargin",
    "maintenanceMargin",
    "point10Input",
    "point100Input"
  ].forEach(id => {
    $(id).value = 0;
  });

  updatePointTools();
  calculate();
}

function setProduct(product) {
  currentProduct = product;
  document.querySelectorAll("[data-product]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.product === product);
  });

  $("initialMargin").value = products[product].initialMargin;
  $("maintenanceMargin").value = products[product].maintenanceMargin;
  $("feeOneWay").value = products[product].feeOneWay;
  calculate();
}

document.querySelectorAll("[data-product]").forEach(btn => {
  btn.addEventListener("click", () => setProduct(btn.dataset.product));
});

$("longBtn").addEventListener("click", () => {
  direction = "long";
  $("longBtn").classList.add("active");
  $("shortBtn").classList.remove("active");
  calculate();
});

$("shortBtn").addEventListener("click", () => {
  direction = "short";
  $("shortBtn").classList.add("active");
  $("longBtn").classList.remove("active");
  calculate();
});

[
  "entryPrice",
  "exitPrice",
  "contracts",
  "feeOneWay",
  "accountPrincipal",
  "initialMargin",
  "maintenanceMargin",
  "includeTax"
].forEach(id => {
  $(id).addEventListener("input", calculate);
  $(id).addEventListener("change", calculate);
});

["point10Input", "point100Input"].forEach(id => {
  $(id).addEventListener("input", updatePointTools);
});

$("clearBtn").addEventListener("click", clearToZero);
$("calculateBtn").addEventListener("click", calculate);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

updatePointTools();
calculate();
