import React, { useContext, useEffect, useState } from 'react';
import {
	Box,
	IconButton,
	useDisclosure,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalCloseButton,
	ModalBody,
	ModalFooter,
} from '@chakra-ui/react';
import { MdOutlineFilterAlt } from 'react-icons/md';
import FloatingSelect from '../input/FloatingSelect';
import CommonButton from '../button/Button';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../../utils/context/checkToken';

interface FilterDialogProps {
	inputs: {
		label: { [key: string]: string } | string;
		key: string;
		value: string;
		data: Array<{ label: { [key: string]: string } | string; value: string }>;
	}[];
	setFilter: (values: Record<string, string>) => void;
	mr?: string;
}

const FilterDialog: React.FC<FilterDialogProps> = ({
	inputs,
	setFilter,
	mr,
}) => {
	const { t } = useTranslation();
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [values, setValues] = useState<Record<string, string>>({});
	const { language } = useContext(AuthContext)!;
	useEffect(() => {
		const inputsValues = inputs?.reduce(
			(acc, item) => {
				acc[item.key] = item.value;
				return acc;
			},
			{} as Record<string, string>
		);
		setValues(inputsValues);
	}, [inputs]);

	const getValue = (item: { key: string }, value?: string) => {
		setValues((prevValues) => ({ ...prevValues, [item.key]: value ?? '' }));
	};

	if (!Array.isArray(inputs) || inputs.length === 0) {
		return null;
	}

	const handleFilter = () => {
		setFilter(values);
		onClose();
	};

	return (
		<Box>
			<IconButton
				aria-label="Filter"
				icon={<MdOutlineFilterAlt />}
				fontSize="25px"
				// marginLeft="100%"
				onClick={onOpen}
				variant="ghost"
				colorScheme="#484848"
				marginRight={mr}
			/>

			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>{t('COMMON_FILTERS_TITLE')}</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						{inputs.map((item) => (
							<FloatingSelect
								key={item.key}
								label={
									typeof item.label === 'string'
										? item.label
										: item.label?.[language?.name] ||
										item.label?.['en'] ||
										''
								}
								options={item.data.map((opt) => ({
									...opt,
									label:
										typeof opt.label === 'string'
											? opt.label
											: opt.label?.[language?.name] ||
											opt.label?.['en'] ||
											'',
								}))}
								value={values?.[item?.key] || ''}
								onChange={(e) => {
									getValue(item, e.target.value);
								}}
								name="label"
								language={language.name}
							/>
						))}
					</ModalBody>

					<ModalFooter>
						<CommonButton
							label={t('COMMON_FILTERS_APPLY_BUTTON')}
							onClick={handleFilter}
						/>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</Box>
	);
};

export default FilterDialog;
