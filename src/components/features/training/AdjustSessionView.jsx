
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Title, Subtitle, Button, Slider } from '../../ui/LayoutComponents';
import { FaSave, FaRunning } from 'react-icons/fa';

const AdjustSessionView = ({ onSaveAdjustments, onStart, routine }) => {
    const { t } = useTranslation();

    // Placeholder for adjustment logic
    const handleSliderChange = (e) => {
        console.log("Intensity changed to:", e.target.value);
    };

    if (!routine) {
        return (
            <div className="p-4 text-center">
                <Title>{t('noRoutineFound')}</Title>
                <Subtitle>{t('generatePlanFirst')}</Subtitle>
            </div>
        );
    }

    return (
        <div className="p-4 animate-fade-in">
            <Card className="bg-gray-800 shadow-xl rounded-2xl p-6">
                <Title className="font-bold text-2xl">{t('adjustSessionTitle')}</Title>
                <Subtitle className="mb-6">{t('adjustSessionSubtitle')}</Subtitle>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('intensityLabel')} (50%)
                        </label>
                        <Slider
                            name="intensity"
                            min="10"
                            max="100"
                            defaultValue="50"
                            onChange={handleSliderChange}
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('durationLabel')} (45 {t('minutes')})
                        </label>
                        <Slider
                            name="duration"
                            min="15"
                            max="90"
                            defaultValue="45"
                            onChange={handleSliderChange}
                        />
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <Button onClick={onSaveAdjustments} className="w-full bg-blue-600 hover:bg-blue-500">
                        <FaSave className="mr-2" /> {t('saveAdjustmentsButton')}
                    </Button>
                    <Button onClick={onStart} className="w-full bg-green-600 hover:bg-green-500">
                        <FaRunning className="mr-2" /> {t('startNowButton')}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default AdjustSessionView;
