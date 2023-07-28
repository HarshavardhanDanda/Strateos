export const PAGE_SIZE_OPTION_1 = 10;
export const PAGE_SIZE_OPTION_2 = 25;
export const PAGE_SIZE_OPTION_3 = 50;
export const PAGE_SIZE_OPTION_4 = 100;

export const PAGE_SIZE_OPTIONS = [
  PAGE_SIZE_OPTION_1,
  PAGE_SIZE_OPTION_2,
  PAGE_SIZE_OPTION_3,
  PAGE_SIZE_OPTION_4
];

export const getDefaultSearchPerPage = (): number => {
  return PAGE_SIZE_OPTIONS[0];
};
