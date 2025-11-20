import React from 'react';
import { ArrowRight, CheckCircle, Shield, Zap, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';

interface LandingPageProps {
    onLogin: () => void;
    onSignup: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignup }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <header className="container mx-auto px-4 py-6 flex justify-between items-center relative z-20">
                <div className="flex items-center gap-3">
                    <img src="/assets/logo.png" alt="RecuperaTax" className="h-12" />
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={onLogin}>
                        Entrar
                    </Button>
                    <Button
                        onClick={onSignup}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                        Comece Grátis
                    </Button>
                </div>
            </header>

            {/* Hero Section with Background Banner */}
            <section className="relative overflow-hidden">
                {/* Banner Background - Fixed at top, shifted to the right */}
                <div
                    className="absolute top-0 w-full h-[672px] bg-no-repeat opacity-95"
                    style={{
                        backgroundImage: 'url(/assets/banner_landing_page.png)',
                        backgroundSize: 'auto 100%',
                        backgroundPosition: 'calc(100% + 200px) top'
                    }}
                />
                <div className="absolute top-0 left-0 w-full h-[672px] bg-gradient-to-br from-blue-50/20 via-white/40 to-transparent" />

                {/* Hero Content */}
                <div className="container mx-auto px-4 py-20 text-center relative z-10">
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                            Recupere seus créditos de
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> PIS/COFINS</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                            Plataforma profissional para empresas do Simples Nacional identificarem e recuperarem créditos tributários de produtos monofásicos.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button
                                size="lg"
                                onClick={onSignup}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-6 shadow-xl"
                            >
                                Calcular Meus Créditos
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={onLogin}
                                className="text-lg px-8 py-6 border-2"
                            >
                                Já tenho conta
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="container mx-auto px-4 py-16">
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-blue-100 hover:shadow-xl transition-shadow">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                            <Zap className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Análise Automática</h3>
                        <p className="text-gray-600">
                            Upload de XMLs e identificação automática de produtos monofásicos com base em NCM e regras da Receita Federal.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-blue-100 hover:shadow-xl transition-shadow">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Cálculo Preciso</h3>
                        <p className="text-gray-600">
                            Apuração mensal considerando RBT12, anexo do Simples e alíquotas efetivas para cálculo exato do crédito.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-blue-100 hover:shadow-xl transition-shadow">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Dados Seguros</h3>
                        <p className="text-gray-600">
                            Seus dados são protegidos com autenticação e isolamento por usuário. Cada empresa vê apenas suas informações.
                        </p>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="container mx-auto px-4 py-16 bg-white/50 rounded-3xl my-16">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Por que usar o RecuperaTax?</h2>
                    <div className="space-y-4">
                        {[
                            'Identifique automaticamente produtos com tributação monofásica',
                            'Calcule créditos de PIS/COFINS de forma precisa e confiável',
                            'Gere relatórios profissionais em Excel e PDF',
                            'Gerencie múltiplas empresas em uma única conta',
                            'Interface intuitiva e fácil de usar'
                        ].map((benefit, i) => (
                            <div key={i} className="flex items-start gap-3 animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                                <p className="text-lg text-gray-700">{benefit}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="container mx-auto px-4 py-20 text-center">
                <div className="max-w-2xl mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white shadow-2xl">
                    <h2 className="text-3xl font-bold mb-4">Pronto para recuperar seus créditos?</h2>
                    <p className="text-lg mb-8 text-blue-100">
                        Comece agora mesmo. É grátis e leva menos de 1 minuto.
                    </p>
                    <Button
                        size="lg"
                        onClick={onSignup}
                        className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 shadow-xl"
                    >
                        Criar Conta Grátis
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="container mx-auto px-4 py-8 text-center text-gray-600 border-t">
                <p>© 2025 RecuperaTax - Sistema profissional de recuperação tributária</p>
            </footer>
        </div>
    );
};

export default LandingPage;
