interface FilterOption {
	id: number;
	label: { [key: string]: string };
	value: string;
}
export const Gender: FilterOption[] = [
	{ id: 1, label: { en: 'Male', hi: 'पुरुष', mr: 'पुरुष' }, value: 'male' },
	{ id: 2, label: { en: 'Female', hi: 'महिला', mr: 'महिला' }, value: 'female' },
	{ id: 3, label: { en: 'Both', hi: 'दोनों', mr: 'दोन्ही' }, value: 'both' },
];

export const IncomeRange: FilterOption[] = [
	{ id: 1, label: { en: 'All', hi: 'सभी', mr: 'सर्व' }, value: '' },
	{
		id: 2,
		label: { en: 'Below 1,00,000', hi: '1,00,000 से कम', mr: '1,00,000 पेक्षा कमी' },
		value: '0-100000',
	},
	{
		id: 3,
		label: { en: 'Below 2,50,000', hi: '2,50,000 से कम', mr: '2,50,000 पेक्षा कमी' },
		value: '0-250000',
	},
	{
		id: 4,
		label: { en: 'Below 5,00,000', hi: '5,00,000 से कम', mr: '5,00,000 पेक्षा कमी' },
		value: '0-500000',
	},
	{
		id: 5,
		label: { en: 'Below 7,50,000', hi: '7,50,000 से कम', mr: '7,50,000 पेक्षा कमी' },
		value: '0-750000',
	},
];

export const Castes: FilterOption[] = [
	{ id: 1, label: { en: 'All', hi: 'सभी', mr: 'सर्व' }, value: '' },
	{ id: 2, label: { en: 'SC', hi: 'एससी', mr: 'एससी' }, value: 'sc' },
	{ id: 3, label: { en: 'ST', hi: 'एसटी', mr: 'एसटी' }, value: 'st' },
	{ id: 4, label: { en: 'OBC', hi: 'ओबीसी', mr: 'ओबीसी' }, value: 'obc' },
	{ id: 5, label: { en: 'General', hi: 'जनरल', mr: 'जनरल' }, value: 'general' },
];
export const BenefitAmount: FilterOption[] = [
	{ id: 1, label: { en: '12,000', hi: '12,000', mr: '12,000' }, value: '12000' },
	{ id: 2, label: { en: '35,000', hi: '35,000', mr: '35,000' }, value: '35000' },
];
