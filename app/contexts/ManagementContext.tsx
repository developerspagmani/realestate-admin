'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

import { tenantService, getAuthToken } from '@/app/services/api';
import { getCurrencyConfig } from '@/app/utils/currencyUtils';
import { useAuthContext } from './AuthContext';

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
    refreshTenant: () => Promise<void>;
}

const ManagementContext = createContext<ManagementContextType | undefined>(undefined);

export function ManagementProvider({ children }: { children: ReactNode }) {
    const [tenantType, setTenantTypeState] = useState<number>(1);
    const [activeTenantId, setActiveTenantIdState] = useState<string | null>(null);
    const [activeOwnerId, setActiveOwnerIdState] = useState<string | null>(null);
    const [activeTenant, setActiveTenant] = useState<any | null>(null);
    const [currencySymbol, setCurrencySymbol] = useState('AED ');
    const [currencyCode, setCurrencyCode] = useState('AED');
    const [isInitialized, setIsInitialized] = useState(false);
    const { user, isOwner, isAdmin } = useAuthContext();

    const fetchTenant = useCallback(async () => {
        if (!activeTenantId) {
            setActiveTenant(null);
            setCurrencySymbol('USD ');
            setCurrencyCode('USD');
            return;
        }

        const token = getAuthToken();
        if (!token) return;

        // Security check: If not admin, verify they are fetching their own tenant
        if (!isAdmin && user?.tenantId && activeTenantId !== user.tenantId) {
            console.warn('ManagementContext: Unauthorized tenant fetch attempted. Redirecting to user tenant.');
            return;
        }

        try {
            const res = await tenantService.getTenantById(token, activeTenantId);
            if (res.success) {
                const tenantData = res.data;
                setActiveTenant(tenantData);

                // Prefer explicit currency setting from tenant settings
                const settings = tenantData.settings || {};
                const baseCurrency = settings.general?.currency;

                // Fallback to country-based currency if no explicit currency set
                const config = getCurrencyConfig(baseCurrency || tenantData.country);
                setCurrencySymbol(config.symbol);
                setCurrencyCode(config.code);
            }
        } catch (error: any) {
            // Silently catch access denied to prevent app crash
            if (error.message?.includes('Access denied')) {
                console.error('ManagementContext: Access denied for tenant', activeTenantId);
                // If we get access denied, we should probably clear the active tenant ID
                if (isAdmin) setActiveTenantIdState(null);
            } else {
                console.error('Failed to fetch tenant details:', error);
            }
        }
    }, [activeTenantId, isAdmin, user?.tenantId]);

    // Initialize from localStorage on mount
    useEffect(() => {
        const savedType = localStorage.getItem('mgmt_tenant_type');
        const savedTenantId = localStorage.getItem('mgmt_tenant_id');
        const savedOwnerId = localStorage.getItem('mgmt_owner_id');

        if (savedType) setTenantTypeState(parseInt(savedType));

        // For non-admins, always prefer their own tenant ID
        if (isOwner && user?.tenantId) {
            setActiveTenantIdState(user.tenantId);
        } else if (savedTenantId) {
            setActiveTenantIdState(savedTenantId);
        }

        if (savedOwnerId) setActiveOwnerIdState(savedOwnerId);
        setIsInitialized(true);
    }, [isOwner, user?.tenantId]);

    // Sync activeTenantId for Owners if they logout/login
    useEffect(() => {
        if (isOwner && user?.tenantId && activeTenantId !== user.tenantId) {
            setActiveTenantIdState(user.tenantId);
        }
    }, [isOwner, user?.tenantId, activeTenantId]);

    // Fetch tenant details when activeTenantId changes
    useEffect(() => {
        fetchTenant();
    }, [fetchTenant]);

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

        if (tenantId) {
            localStorage.setItem('mgmt_tenant_id', tenantId);
            document.cookie = `tenant-id=${tenantId}; path=/; max-age=86400; SameSite=Lax`;
        } else {
            localStorage.removeItem('mgmt_tenant_id');
            document.cookie = 'tenant-id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        }
    };

    const refreshTenant = async () => {
        await fetchTenant();
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
            isCommandCenterActive: true,
            refreshTenant
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
