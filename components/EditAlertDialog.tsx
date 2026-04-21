'use client';

import { useState } from 'react';
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
import { updateAlert } from '@/lib/actions/alert.actions';
import { toast } from 'sonner';
import {Pencil} from "lucide-react";

export default function EditAlertDialog({ alert }: { alert: any }) {
    const [open, setOpen] = useState(false);

    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            alertType: alert.alertType,
            condition: alert.condition,
            threshold: alert.threshold,
        },
    });

    const onSubmit = async (data: any) => {
        try {
            await updateAlert(alert._id, data);
            toast.success('Alert updated successfully!');
            setOpen(false);
        } catch (e) {
            console.error(e);
            toast.error('Failed to update alert');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="alert-dialog">
                <DialogHeader>
                    <DialogTitle className="alert-title">
                        Edit Alert for {alert.symbol}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
                    <SelectField
                        name="alertType"
                        label="Alert Type"
                        control={control}
                        options={ALERT_TYPE_OPTIONS}
                        error={errors.alertType as any}
                        required
                    />
                    <SelectField
                        name="condition"
                        label="Condition"
                        control={control}
                        options={CONDITION_OPTIONS}
                        error={errors.condition as any}
                        required
                    />
                    <InputField
                        name="threshold"
                        label="Threshold"
                        placeholder="e.g., 150.50"
                        type="number"
                        step="any"
                        register={register}
                        error={errors.threshold as any}
                        validation={{ required: 'Threshold is required', valueAsNumber: true }}
                    />
                    <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                        {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                    </Button>
                </form>

            </DialogContent>
        </Dialog>
    );
}