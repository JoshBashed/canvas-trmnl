import React, { type FC } from 'react';

export const LoadingIcon: FC = () => {
    return (
        <svg
            aria-label='Loading...'
            className='h-8 w-8'
            role='img'
            viewBox='0 0 200 200'
            xmlns='http://www.w3.org/2000/svg'
        >
            <radialGradient
                cx='.66'
                cy='.3125'
                fx='.66'
                fy='.3125'
                gradientTransform='scale(1.5)'
            >
                <stop offset='0' stopColor='#FFFFFF' />
                <stop offset='.3' stopColor='#FFFFFF' stopOpacity='.9' />
                <stop offset='.6' stopColor='#FFFFFF' stopOpacity='.6' />
                <stop offset='.8' stopColor='#FFFFFF' stopOpacity='.3' />
                <stop offset='1' stopColor='#FFFFFF' stopOpacity='0' />
            </radialGradient>
            <circle
                cx='100'
                cy='100'
                fill='none'
                r='70'
                stroke='url(#a9)'
                strokeDasharray='200 1000'
                strokeDashoffset='0'
                strokeLinecap='round'
                strokeWidth='30'
                style={{ transformOrigin: 'center' }}
            >
                <animateTransform
                    attributeName='transform'
                    calcMode='spline'
                    dur='0.5'
                    keySplines='0 0 1 1'
                    keyTimes='0;1'
                    repeatCount='indefinite'
                    type='rotate'
                    values='360;0'
                />
            </circle>
            <circle
                cx='100'
                cy='100'
                fill='none'
                opacity='.2'
                r='70'
                stroke='#FFFFFF'
                strokeLinecap='round'
                strokeWidth='30'
                style={{ transformOrigin: 'center' }}
            />
        </svg>
    );
};
