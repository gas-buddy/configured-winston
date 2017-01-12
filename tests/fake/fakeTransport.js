export const status = {
  started: false,
};

export function startNoAdd() {
  return true;
}

export function start() {
  status.started = true;
}

export async function stop() {
  await new Promise(accept => setTimeout(() => {
    status.started = false;
    accept();
  }, 1));
}
