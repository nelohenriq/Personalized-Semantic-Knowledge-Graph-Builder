import React from 'react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { ConceptsIcon } from '../components/icons/ConceptsIcon';
import { RelationshipsIcon } from '../components/icons/RelationshipsIcon';
import { DomainsIcon } from '../components/icons/DomainsIcon';
import { DocumentsIcon } from '../components/icons/DocumentsIcon';
import { LightningIcon } from '../components/icons/LightningIcon';
import { BulbIcon } from '../components/icons/BulbIcon';

interface OverviewViewProps {
    stats: {
        concepts: number;
        relationships: number;
        domains: number;
        documents: number;
    };
}

const QuickStartStep: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground font-semibold">
            {number}
        </div>
        <div>
            <h4 className="font-semibold text-card-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground">{children}</p>
        </div>
    </div>
);

const OverviewView: React.FC<OverviewViewProps> = ({ stats }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Concepts" 
                    value={stats.concepts} 
                    subtitle="Extracted from documents" 
                    icon={ConceptsIcon} 
                />
                <StatCard 
                    title="Relationships" 
                    value={stats.relationships} 
                    subtitle="Semantic connections" 
                    icon={RelationshipsIcon} 
                />
                <StatCard 
                    title="Domains" 
                    value={stats.domains} 
                    subtitle="Knowledge areas" 
                    icon={DomainsIcon} 
                />
                <StatCard 
                    title="Documents" 
                    value={stats.documents} 
                    subtitle="Processed files" 
                    icon={DocumentsIcon} 
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <div className="flex items-center space-x-3 mb-4">
                        <LightningIcon className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Quick Start Guide</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">Get started with building your knowledge graph.</p>
                    <div className="space-y-6">
                        <QuickStartStep number={1} title="Upload Documents">Add PDFs, articles, notes, or textbooks</QuickStartStep>
                        <QuickStartStep number={2} title="Automatic Processing">AI extracts concepts and relationships</QuickStartStep>
                        <QuickStartStep number={3} title="Explore Connections">Navigate your new knowledge graph</QuickStartStep>
                    </div>
                </Card>
                 <Card className="lg:col-span-2">
                    <div className="flex items-center space-x-3 mb-4">
                        <BulbIcon className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Recent Insights</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">Latest discoveries from your knowledge graph.</p>
                    <div className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-lg">
                        <p className="text-muted-foreground">Upload documents to start generating insights</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default OverviewView;
