'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ManagementContextType {
    tenantType: number; // 1: Real Estate, 2: Coworking, 3: Mixed
    setTenantType: (type: number) => void;
    activeTenantId: string | null;
    setActiveTenantId: (id: string | null) => void;
    activeOwnerId: string | null;
    setActiveOwnerId: (id: string | null) => void;
    setActiveOwnerAndTenant: (ownerId: string | null, tenantId: string | null) => void;
    isCommandCenterActive: boolean;
}

const ManagementContext = createContext<ManagementContextType | undefined>(undefined);

export function ManagementProvider({ children }: { children: ReactNode }) {
    const [tenantType, setTenantTypeState] = useState<number>(2); // Default to Coworking
    const [activeTenantId, setActiveTenantIdState] = useState<string | null>(null);
    const [activeOwnerId, setActiveOwnerIdState] = useState<string | null>(null);
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

    const setTenantType = (type: number) => {
        setTenantTypeState(type);
        localStorage.setItem('mgmt_tenant_type', type.toString());
        // Reset sub-selections when type changes
        setActiveTenantId(null);
        setActiveOwnerId(null);
    };

    const setActiveTenantId = (id: string | null) => {
        setActiveTenantIdState(id);
        if (id) localStorage.setItem('mgmt_tenant_id', id);
        else localStorage.removeItem('mgmt_tenant_id');
        // Reset owner when tenant changes
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
