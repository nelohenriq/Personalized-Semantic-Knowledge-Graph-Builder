import React from 'react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { ConceptsIcon } from '../components/icons/ConceptsIcon';
import { RelationshipsIcon } from '../components/icons/RelationshipsIcon';
import { DomainsIcon } from '../components/icons/DomainsIcon';
import { DocumentsIcon } from '../components/icons/DocumentsIcon';
import { RefreshIcon } from '../components/icons/RefreshIcon';
import { ProgressBarIcon } from '../components/icons/ProgressBarIcon';

interface InsightsViewProps {
    stats: {
        concepts: number;
        relationships: number;
        domains: number;
        documents: number;
    };
}

const InsightsView: React.FC<InsightsViewProps> = ({ stats }) => {
    const conceptsMastered = 0; // Placeholder
    const progress = stats.concepts > 0 ? (conceptsMastered / stats.concepts) * 100 : 0;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">Knowledge Insights & Analytics</h2>
                    <p className="text-muted-foreground">AI-generated insights from your knowledge graph</p>
                </div>
                <button className="flex items-center space-x-2 text-sm text-secondary-foreground bg-secondary rounded-lg px-3 py-1.5 hover:bg-muted transition-colors">
                    <RefreshIcon className="w-4 h-4" />
                    <span>Refresh Insights</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <div className="flex items-center space-x-3 mb-2">
                        <ProgressBarIcon className="w-5 h-5 text-muted-foreground" />
                        <h3 className="font-semibold text-card-foreground">Overall Learning Progress</h3>
                    </div>
                    <p className="text-2xl font-bold">{progress.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">{conceptsMastered} of {stats.concepts} concepts mastered</p>
                    <div className="w-full bg-secondary rounded-full h-2.5 mt-4">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </Card>
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <StatCard title="Total Concepts" value={stats.concepts} icon={ConceptsIcon} dense />
                     <StatCard title="Relationships" value={stats.relationships} icon={RelationshipsIcon} dense />
                     <StatCard title="Domains" value={stats.domains} icon={DomainsIcon} dense />
                     <StatCard title="Documents" value={stats.documents} icon={DocumentsIcon} dense />
                </div>
            </div>
        </div>
    );
};

export default InsightsView;
