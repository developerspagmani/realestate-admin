'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { tenantService, getAuthToken } from '@/app/services/api';
import { getCurrencyConfig } from '@/app/utils/currencyUtils';

interface ManagementContextType {
    tenantType: number; // 1: Real Estate, 2: Coworking, 3: Mixed
    setTenantType: (type: number) => void;
    activeTenantId: string | null;
    setActiveTenantId: (id: string | null) => void;
    activeOwnerId: string | null;
    setActiveOwnerId: (id: string | null) => void;
    setActiveOwnerAndTenant: (ownerId: string | null, tenantId: string | null) => void;
    activeTenant: any | null;
    currencySymbol: string;
    currencyCode: string;
    isCommandCenterActive: boolean;
}

const ManagementContext = createContext<ManagementContextType | undefined>(undefined);

export function ManagementProvider({ children }: { children: ReactNode }) {
    const [tenantType, setTenantTypeState] = useState<number>(1);
    const [activeTenantId, setActiveTenantIdState] = useState<string | null>(null);
    const [activeOwnerId, setActiveOwnerIdState] = useState<string | null>(null);
    const [activeTenant, setActiveTenant] = useState<any | null>(null);
    const [currencySymbol, setCurrencySymbol] = useState('$');
    const [currencyCode, setCurrencyCode] = useState('USD');
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize from localStorage on mount
    useEffect(() => {
        const savedType = localStorage.getItem('mgmt_tenant_type');
        const savedTenantId = localStorage.getItem('mgmt_tenant_id');
        const savedOwnerId = localStorage.getItem('mgmt_owner_id');

        if (savedType) setTenantTypeState(parseInt(savedType));
        if (savedTenantId) setActiveTenantIdState(savedTenantId);
        if (savedOwnerId) setActiveOwnerIdState(savedOwnerId);
        setIsInitialized(true);
    }, []);

    // Fetch tenant details when activeTenantId changes
    useEffect(() => {
        if (!activeTenantId) {
            setActiveTenant(null);
            setCurrencySymbol('$');
            setCurrencyCode('USD');
            return;
        }

        const fetchTenant = async () => {
            const token = getAuthToken();
            if (!token) return;
            try {
                const res = await tenantService.getTenantById(token, activeTenantId);
                if (res.success) {
                    setActiveTenant(res.data);
                    const config = getCurrencyConfig(res.data.country);
                    setCurrencySymbol(config.symbol);
                    setCurrencyCode(config.code);
                }
            } catch (error) {
                console.error('Failed to fetch tenant details:', error);
            }
        };

        fetchTenant();
    }, [activeTenantId]);

    const setTenantType = (type: number) => {
        setTenantTypeState(type);
        localStorage.setItem('mgmt_tenant_type', type.toString());
        setActiveTenantId(null);
        setActiveOwnerId(null);
    };

    const setActiveTenantId = (id: string | null) => {
        setActiveTenantIdState(id);
        if (id) localStorage.setItem('mgmt_tenant_id', id);
        else localStorage.removeItem('mgmt_tenant_id');
        setActiveOwnerId(null);
    };

    const setActiveOwnerId = (id: string | null) => {
        setActiveOwnerIdState(id);
        if (id) localStorage.setItem('mgmt_owner_id', id);
        else localStorage.removeItem('mgmt_owner_id');
    };

    const setActiveOwnerAndTenant = (ownerId: string | null, tenantId: string | null) => {
        setActiveOwnerIdState(ownerId);
        setActiveTenantIdState(tenantId);

        if (ownerId) localStorage.setItem('mgmt_owner_id', ownerId);
        else localStorage.removeItem('mgmt_owner_id');

        if (tenantId) localStorage.setItem('mgmt_tenant_id', tenantId);
        else localStorage.removeItem('mgmt_tenant_id');
    };

    return (
        <ManagementContext.Provider value={{
            tenantType,
            setTenantType,
            activeTenantId,
            setActiveTenantId,
            activeOwnerId,
            setActiveOwnerId,
            setActiveOwnerAndTenant,
            activeTenant,
            currencySymbol,
            currencyCode,
            isCommandCenterActive: true
        }}>
            {children}
        </ManagementContext.Provider>
    );
}

export function useManagementContext() {
    const context = useContext(ManagementContext);
    if (context === undefined) {
        throw new Error('useManagementContext must be used within a ManagementProvider');
    }
    return context;
}
