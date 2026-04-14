"use client";
import { SafeAreaInsets, SafeArea as SafeAreaPlugin } from 'capacitor-plugin-safe-area';
import { DetailedHTMLProps, HTMLAttributes, PropsWithChildren } from 'react';
import { useQuery } from '@tanstack/react-query';


type Props = PropsWithChildren & {
    onReady?: () => void;
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
export function SafeArea({ onReady, ...props }: Props) {
    const { data: insets } = useQuery({
        queryKey: ['safe-area'],
        queryFn: async () => {
            const response = await SafeAreaPlugin.getSafeAreaInsets();
            console.log('insets response', response);
            onReady?.();
            return response.insets;
        },
    });


    return <div style={{ paddingTop: insets?.top, paddingBottom: insets?.bottom, paddingLeft: insets?.left, paddingRight: insets?.right }} {...props} > {props.children}</div >;
}