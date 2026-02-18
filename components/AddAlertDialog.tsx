'use client';

import { useForm } from 'react-hook-form';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SelectField from '@/components/forms/SelectField';
import InputField from '@/components/forms/InputField';
import { ALERT_TYPE_OPTIONS, CONDITION_OPTIONS } from '@/lib/constants';
import { createAlert } from '@/lib/actions/alert.actions';
import { toast } from 'sonner';
import { useState } from 'react';

const AddAlertDialog = ({
                            symbol,
                            company,
                        }: {
    symbol: string;
    company: string;
}) => {
    const [open, setOpen] = useState(false);
    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<AlertFormData>({
        defaultValues: {
            alertType: 'price',
            condition: 'upper',
            threshold: "",
        },
        mode: 'onBlur',
    });

    const onSubmit = async (data: AlertFormData) => {
        try {
            const alertData = {
                ...data,
                threshold: Number(data.threshold),
                symbol,
                company,
            };

            const result = await createAlert(alertData);

            if (result.success) {
                toast.success('Alert created successfully!');
                setOpen(false);
                reset();
            } else {
                toast.error('Failed to create alert', {
                    description: result.error,
                });
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to create alert', {
                description:
                    e instanceof Error ? e.message : 'An unexpected error occurred.',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="add-alert">
                    Add Alert
                </Button>
            </DialogTrigger>
            <DialogContent className="alert-dialog">
                <DialogHeader>
                    <DialogTitle className="alert-title">
                        Create Alert for {symbol}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
                    <SelectField name="alertType" label="Alert Type" control={control} options={ALERT_TYPE_OPTIONS} error={errors.alertType} required />
                    <SelectField name="condition" label="Condition" control={control} options={CONDITION_OPTIONS} error={errors.condition} required />
                    <InputField name="threshold" label="Threshold" placeholder="e.g., 150" type="number" register={register} error={errors.threshold} validation={{ required: 'Threshold is required', valueAsNumber: true }} />
                    <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                        {isSubmitting ? 'Creating Alert...' : 'Create Alert'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddAlertDialog;