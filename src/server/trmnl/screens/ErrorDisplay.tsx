import React, { type FC } from 'react';
import { CanvasLogo } from '@/server/trmnl/screens/CanvasLogo.tsx';

export interface ErrorDisplayProps {
    errorMessage: string;
}

export const ErrorDisplay: FC<ErrorDisplayProps> = ({ errorMessage }) => {
    return (
        <>
            <div className='layout'>
                <div className='columns'>
                    <div className='column'>
                        <div className='markdown gap--large'>
                            <span className='title'>Error</span>
                            <p className='description'>{errorMessage}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className='title_bar'>
                <CanvasLogo />
                <span className='title'>Canvas LMS</span>
            </div>
        </>
    );
};
