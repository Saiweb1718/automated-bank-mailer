export const transactionreference = () =>{
   const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  const random = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  
  return `TXN${dateStr}${random}`;
}