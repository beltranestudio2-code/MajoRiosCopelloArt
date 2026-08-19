export const moneyUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const moneyARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
